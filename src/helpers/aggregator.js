/* aggregator.js
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

const KEYWORDS = {
    'sum': 'sum',
    'total': 'sum',
    'avg': 'avg',
    'average': 'avg',
    'mean': 'avg',
    'count': 'count',
    'min': 'min',
    'max': 'max',
}

export function isAggregateKeyword(word) {
    if (!word) return false;
    return KEYWORDS[word.trim().toLowerCase()] !== undefined;
}

export function computeAggregate(keyword, scope) {
    const op = KEYWORDS[keyword.trim().toLowerCase()];
    if (!op) return null;

    const values = Object.values(scope)
        .filter(v => typeof v === 'number' && isFinite(v));

    if (values.length === 0) return null;

    switch (op) {
        case 'sum':
            return values.reduce((a, b) => a + b, 0);
        case 'avg':
            return values.reduce((a, b) => a + b, 0) / values.length;
        case 'count':
            return values.length;
        case 'min':
            return Math.min(...values);
        case 'max':
            return Math.max(...values);
        default:
            return null;
    }
}
