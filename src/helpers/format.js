/* format.js
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

import { locale, separators } from './locale.js';

export function normalizeNumbers(text) {
    const { group, decimal } = separators();

    if (group)
        text = text.replace(new RegExp(`(\\d{1,3})(?:${escapeRegex(group)}\\d{3})+(?!\\d)`, 'g'),
                            match => match.split(group).join(''));

    return text.replace(new RegExp(`(\\d)${escapeRegex(decimal)}(\\d)`, 'g'), '$1.$2');
}

export function formatNumber(value, maximumFractionDigits = 4) {
    return value.toLocaleString(locale(), { maximumFractionDigits });
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
