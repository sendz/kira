/* calculator.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { stripMarkdown } from './markdown.js';
import { normalizeNumbers, formatNumber } from './format.js';
import { convertUnit, isUnit } from './unit.js';
import { isCurrency, formatWithSymbol } from './currencies.js';
import { isAggregateKeyword, computeAggregate } from './aggregator.js';

const AGGREGATE_LINE_REGEX = /^([A-Za-z]+)\b\s*(?:=\s*(.*))?$/i;
const CONVERT_REGEX = /^\s*(-?\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*)\s*([a-zA-Z]+)\s+(?:to|in)\s+([a-zA-Z]+)\s*$/i;
const CONVERT_VARIABLE_REGEX = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s+(?:to|in)\s+([a-zA-Z]+)\s*$/i;
const QUANTITY_REGEX = /^\s*(-?\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*)\s+([a-zA-Z]+)\s*$/i;
const CONVERT_EXPRESSION_REGEX = /^\s*(.+?)\s+(?:to|in)\s+([a-zA-Z]+)\s*$/i;

export function clearResults(buffer, results) {
    for (const { start, end } of results) {
        const startIter = buffer.get_iter_at_mark(start);
        const endIter = buffer.get_iter_at_mark(end);

        buffer.delete(startIter, endIter);
        buffer.delete_mark(start);
        buffer.delete_mark(end);
    }
    results.length = 0;
}

export function insertResults(buffer, results) {
    const start = buffer.get_start_iter();
    const end = buffer.get_end_iter();

    buffer.remove_tag_by_name('calc_line', start, end);

    for (const result of collectResults(buffer.get_text(start, end, true)))
        insertResult(buffer, results, result);
}

function collectResults(text) {
    const scope = { values: {}, units: {}, currencies: {} };
    const results = [];
    const pool = [];     // { value, currency } of non-aggregate result lines
    const marks = {};    // keyword -> pool index after its last aggregate

    for (const [lineIndex, line] of text.split('\n').entries()) {
        const aggregate = line.match(AGGREGATE_LINE_REGEX);
        if (aggregate && isAggregateKeyword(aggregate[1])) {
            const keyword = aggregate[1].toLowerCase();
            const outcome = aggregateValue(keyword, aggregate[2], scope, pool, marks[keyword] ?? 0);
            if (outcome !== null) {
                setMeasurement(scope, keyword, outcome);
                results.push({ lineIndex, value: outcome.value, currency: outcome.currency });
            }
            marks[keyword] = pool.length;
            continue;
        }

        const outcome = evaluateLine(line, scope);
        if (outcome === null)
            continue;

        pool.push({ value: outcome.value, currency: outcome.currency });
        results.push({ lineIndex, value: outcome.value, currency: outcome.currency });
    }

    return results;
}

// Aggregates the values since this keyword's previous occurrence; a keyword
// followed by "=" evaluates that expression instead, like the old total=.
function aggregateValue(keyword, expression, scope, pool, start) {
    const trimmed = (expression ?? '').trim();
    if (trimmed)
        return computeExpression(trimmed, scope);

    const slice = pool.slice(start);
    const value = computeAggregate(keyword, slice.map(entry => entry.value));
    if (value === null)
        return null;

    const currency = keyword === 'count' ? null : sliceCurrency(slice);
    return { value, unit: null, currency };
}

function sliceCurrency(entries) {
    let currency;
    for (const entry of entries)
        currency = mergeCurrency(currency, entry.currency);

    return currency ?? null;
}

function evaluateLine(line, scope) {
    if (!line.trim() || /^#{1,6}\s/.test(line) || /^>/.test(line))
        return null;

    const separator = line.indexOf('=');
    if (separator === -1)
        return null;

    const expression = line.substring(separator + 1).trim();
    if (!expression)
        return null;

    const outcome = computeExpression(expression, scope);
    if (outcome === null)
        return null;

    const name = line.substring(0, separator).trim().match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (name)
        setMeasurement(scope, name[1], outcome);

    return outcome;
}

function computeExpression(expression, scope) {
    const cleaned = normalizeNumbers(stripMarkdown(expression));

    const converted = tryConvert(cleaned, scope);
    if (converted)
        return converted;

    const number = evaluate(cleaned, scope.values);
    return number === null ? null : { value: number, ...inferMeasurement(cleaned, scope) };
}

// Recognises, in order: "<value> <from> to <to>", "<variable> to <to>" using a
// variable's remembered unit, a bare "<value> <unit|currency>", and finally an
// arbitrary "<expression> to <unit>" whose variables share one unit.
function tryConvert(expression, scope) {
    const full = expression.match(CONVERT_REGEX);
    if (full) {
        const value = resolveValue(full[1], scope.values);
        if (value !== null && isUnit(full[2]) && isUnit(full[3])) {
            const converted = convertUnit(value, full[2], full[3]);
            if (converted !== null)
                return { value: converted, unit: full[3].toLowerCase(), currency: null };
        }
    }

    const variable = expression.match(CONVERT_VARIABLE_REGEX);
    if (variable && scope.units[variable[1]] && isUnit(variable[2])) {
        const converted = convertUnit(scope.values[variable[1]], scope.units[variable[1]], variable[2]);
        if (converted !== null)
            return { value: converted, unit: variable[2].toLowerCase(), currency: null };
    }

    const quantity = expression.match(QUANTITY_REGEX);
    if (quantity) {
        const value = resolveValue(quantity[1], scope.values);
        const word = quantity[2];
        if (value !== null && isUnit(word))
            return { value, unit: word.toLowerCase(), currency: null };
        if (value !== null && isCurrency(word))
            return { value, unit: null, currency: word.toUpperCase() };
    }

    const derived = expression.match(CONVERT_EXPRESSION_REGEX);
    if (derived && isUnit(derived[2])) {
        const { unit } = inferMeasurement(derived[1], scope);
        const number = unit === null ? null : evaluate(derived[1], scope.values);
        if (number !== null) {
            const converted = convertUnit(number, unit, derived[2]);
            if (converted !== null)
                return { value: converted, unit: derived[2].toLowerCase(), currency: null };
        }
    }

    return null;
}

// The unit or currency shared by every variable in an expression.
function inferMeasurement(expression, scope) {
    const names = (expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [])
        .filter(name => Object.prototype.hasOwnProperty.call(scope.values, name));

    if (names.length === 0)
        return { unit: null, currency: null };

    const first = names[0];
    const currency = scope.currencies[first];
    if (currency && names.every(name => scope.currencies[name] === currency))
        return { unit: null, currency };

    const unit = scope.units[first];
    if (unit && names.every(name => scope.units[name] === unit))
        return { unit, currency: null };

    return { unit: null, currency: null };
}

function mergeCurrency(current, currency) {
    if (current === undefined)
        return currency ?? null;

    return current === currency ? current : null;
}

function setMeasurement(scope, name, { value, unit, currency }) {
    scope.values[name] = value;

    if (unit)
        scope.units[name] = unit;
    else
        delete scope.units[name];

    if (currency)
        scope.currencies[name] = currency;
    else
        delete scope.currencies[name];
}

function resolveValue(token, values) {
    if (/^-?\d/.test(token))
        return parseFloat(token);

    return Object.prototype.hasOwnProperty.call(values, token) ? values[token] : null;
}

function insertResult(buffer, results, { lineIndex, value, currency }) {
    const [ok, iter] = buffer.get_iter_at_line(lineIndex);
    if (!ok)
        return;

    const lineStart = iter.get_offset();
    iter.forward_to_line_end();
    const lineEnd = iter.get_offset();

    const display = currency ? formatWithSymbol(value, currency) : formatNumber(value);
    const result = `\t= ${display}`;
    buffer.insert(iter, result, -1);

    const resultStart = buffer.get_iter_at_offset(lineEnd);
    const resultEnd = buffer.get_iter_at_offset(lineEnd + result.length);

    buffer.apply_tag_by_name('calc_line', buffer.get_iter_at_offset(lineStart), resultEnd);
    buffer.apply_tag_by_name('calc_result', resultStart, resultEnd);

    results.push({
        start: buffer.create_mark(null, resultStart, false),
        end: buffer.create_mark(null, resultEnd, true),
    });
}

export function evaluate(expr, scope) {
    try {
        const env = { ...scope, Math };
        const keys = Object.keys(env);
        const values = keys.map(k => env[k]);
        const fn = new Function(...keys, `"use strict"; return (${expr});`);
        const result = fn(...values);
        if (typeof result === 'number' && isFinite(result))
            return result;
        return null;
    } catch (e) {
        return null;
    }
}
