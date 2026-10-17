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

const TOTAL_LINE_REGEX = /^total\b\s*(?:=\s*(.*))?$/i;
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
    const values = {};
    const units = {};
    const results = [];
    let sectionTotal = 0;

    for (const [lineIndex, line] of text.split('\n').entries()) {
        const total = line.match(TOTAL_LINE_REGEX);
        if (total) {
            const value = totalValue(total[1], values, units, sectionTotal);
            if (value !== null) {
                values.total = value;
                delete units.total;
                results.push({ lineIndex, value });
            }
            sectionTotal = 0;
            continue;
        }

        const outcome = evaluateLine(line, values, units);
        if (outcome === null)
            continue;

        sectionTotal += outcome.value;
        results.push({ lineIndex, value: outcome.value });
    }

    return results;
}

function totalValue(expression, values, units, sectionTotal) {
    const trimmed = (expression ?? '').trim();
    if (!trimmed)
        return sectionTotal;

    const outcome = computeExpression(trimmed, values, units);
    return outcome === null ? null : outcome.value;
}

function evaluateLine(line, values, units) {
    if (!line.trim() || /^#{1,6}\s/.test(line) || /^>/.test(line))
        return null;

    const separator = line.indexOf('=');
    if (separator === -1)
        return null;

    const expression = line.substring(separator + 1).trim();
    if (!expression)
        return null;

    const outcome = computeExpression(expression, values, units);
    if (outcome === null)
        return null;

    const name = line.substring(0, separator).trim().match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (name) {
        values[name[1]] = outcome.value;
        if (outcome.unit)
            units[name[1]] = outcome.unit;
        else
            delete units[name[1]];
    }

    return outcome;
}

function computeExpression(expression, values, units) {
    const cleaned = normalizeNumbers(stripMarkdown(expression));

    const converted = tryConvert(cleaned, values, units);
    if (converted)
        return converted;

    const number = evaluate(cleaned, values);
    return number === null ? null : { value: number, unit: null };
}

// Recognises, in order: "<value> <from> to <to>", "<variable> to <to>" using a
// variable's remembered unit, a bare quantity "<value> <unit>", and finally an
// arbitrary "<expression> to <to>" where every unit-carrying variable shares
// one unit.
function tryConvert(expression, values, units) {
    const full = expression.match(CONVERT_REGEX);
    if (full) {
        const value = resolveValue(full[1], values);
        if (value !== null && isUnit(full[2]) && isUnit(full[3])) {
            const converted = convertUnit(value, full[2], full[3]);
            if (converted !== null)
                return { value: converted, unit: full[3].toLowerCase() };
        }
    }

    const variable = expression.match(CONVERT_VARIABLE_REGEX);
    if (variable && units[variable[1]] && isUnit(variable[2])) {
        const converted = convertUnit(values[variable[1]], units[variable[1]], variable[2]);
        if (converted !== null)
            return { value: converted, unit: variable[2].toLowerCase() };
    }

    const quantity = expression.match(QUANTITY_REGEX);
    if (quantity) {
        const value = resolveValue(quantity[1], values);
        if (value !== null && isUnit(quantity[2]))
            return { value, unit: quantity[2].toLowerCase() };
    }

    const derived = expression.match(CONVERT_EXPRESSION_REGEX);
    if (derived && isUnit(derived[2])) {
        const source = inferUnit(derived[1], values, units);
        const number = source === null ? null : evaluate(derived[1], values);
        if (number !== null) {
            const converted = convertUnit(number, source, derived[2]);
            if (converted !== null)
                return { value: converted, unit: derived[2].toLowerCase() };
        }
    }

    return null;
}

// The shared unit of every variable referenced by an expression, or null when
// there are none or they disagree.
function inferUnit(expression, values, units) {
    const names = expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
    const known = names.filter(name => Object.prototype.hasOwnProperty.call(values, name));

    const unit = units[known[0]];
    if (!unit || known.some(name => units[name] !== unit))
        return null;

    return unit;
}

function resolveValue(token, values) {
    if (/^-?\d/.test(token))
        return parseFloat(token);

    return Object.prototype.hasOwnProperty.call(values, token) ? values[token] : null;
}

function insertResult(buffer, results, { lineIndex, value }) {
    const [ok, iter] = buffer.get_iter_at_line(lineIndex);
    if (!ok)
        return;

    const lineStart = iter.get_offset();
    iter.forward_to_line_end();
    const lineEnd = iter.get_offset();

    const result = `\t= ${formatNumber(value)}`;
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
