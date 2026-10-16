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

 export function normalizeNumbers(s) {
    return s.replace(/(\d{1,3})(\.\d{3})+(?!\d)/g, (m) => m.replace(/\./g, ''));
}

export function formatNumber(n) {
    if (Number.isInteger(n)) {
        return n.toLocaleString('id-ID');
    }
    return n.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}
