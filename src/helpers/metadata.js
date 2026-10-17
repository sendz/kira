/* metadata.js
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

const LOCALE_LINE = /^\s*>\s*locale\s*:\s*(\S+)\s*$/i;
const QUOTE_LINE = /^\s*>/;

export function readLocale(text) {
    const lines = text.split('\n');
    const block = headerBlock(lines);

    if (!block)
        return null;

    for (let i = block.start; i < block.end; i++) {
        const match = lines[i].match(LOCALE_LINE);
        if (match)
            return match[1];
    }

    return null;
}

export function writeLocale(text, value) {
    const line = `> locale: ${value}`;
    const lines = text.split('\n');
    const block = headerBlock(lines);

    if (!block) {
        const start = lines.findIndex(l => l.trim() !== '');
        lines.splice(start === -1 ? 0 : start, 0, line, '');
        return lines.join('\n');
    }

    const found = lines.findIndex((l, i) => i >= block.start && i < block.end && LOCALE_LINE.test(l));

    if (found === -1)
        lines.splice(block.start, 0, line);
    else
        lines[found] = line;

    return lines.join('\n');
}

function headerBlock(lines) {
    const start = lines.findIndex(line => line.trim() !== '');

    if (start === -1 || !QUOTE_LINE.test(lines[start]))
        return null;

    let end = start;
    while (end < lines.length && QUOTE_LINE.test(lines[end]))
        end++;

    return { start, end };
}
