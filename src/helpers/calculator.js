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
