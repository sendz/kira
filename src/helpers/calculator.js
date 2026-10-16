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

const TOTAL_LINE_REGEX = /^total\b\s*(?:=\s*(.*))?$/i;

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
    const scope = {};
    const results = [];
    let sectionTotal = 0;

    for (const [lineIndex, line] of text.split('\n').entries()) {
        const total = line.match(TOTAL_LINE_REGEX);
        if (total) {
            const value = totalValue(total[1], scope, sectionTotal);
            if (value !== null) {
                scope.total = value;
                results.push({ lineIndex, value });
            }
            sectionTotal = 0;
            continue;
        }

        const value = evaluateLine(line, scope);
        if (value === null)
            continue;

        sectionTotal += value;
        results.push({ lineIndex, value });
    }

    return results;
}

function totalValue(expression, scope, sectionTotal) {
    const trimmed = (expression ?? '').trim();
    if (!trimmed)
        return sectionTotal;

    return evaluate(normalizeNumbers(stripMarkdown(trimmed)), scope);
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

    const value = evaluate(normalizeNumbers(stripMarkdown(expression)), scope);
    if (value === null)
        return null;

    const name = line.substring(0, separator).trim().match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (name)
        scope[name[1]] = value;

    return value;
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
