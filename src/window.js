/* window.js
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

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { setupMarkdownTags, applyMarkdown, stripMarkdown } from './helpers/markdown.js';
import { clearResults } from './helpers/calculator.js';
import { normalizeNumbers } from './helpers/format.js';

export const ScratchPadWindow = GObject.registerClass({
    GTypeName: 'ScratchPadWindow',
    Template: 'resource:///com/sendyyeah/ScratchPad/window.ui',
    InternalChildren: ['text_view'],
}, class ScratchPadWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });

        this._buffer = this._text_view.get_buffer();
        this._isUpdating = false;
        this._resultMarks = [];

        setupMarkdownTags(this._buffer);

        this._buffer.connect('changed', () => {
            if (this._isUpdating) return true;

            this._isUpdating = true;

            try {
                clearResults(this._buffer, this._resultMarks);
                applyMarkdown(this._buffer);
                this._insertResults();
            } finally {
                this._isUpdating = false;
            }
        })
    }

    _insertResults() {
        const buffer = this._buffer;
        const start = buffer.get_start_iter();
        const end = buffer.get_end_iter();
        const text = buffer.get_text(start, end, true);
        const lines = text.split('\n');

        const scope = {};
        const updates = [];     // { lineIndex, value }

        let offset = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineStart = offset;
            offset += line.length + 1;

            // Skip baris kosong, heading, blockquote
            if (!line.trim()) continue;
            if (/^#{1,6}\s/.test(line)) continue;
            if (/^>/.test(line)) continue;

            const eqIndex = line.indexOf('=');
            if (eqIndex === -1) continue;

            const lhs = line.substring(0, eqIndex).trim();
            const rhs = line.substring(eqIndex + 1).trim();
            if (!rhs) continue;

            // Bersihkan markdown dari RHS
            let expr = stripMarkdown(rhs);

            // Normalisasi angka Indonesia: 75.000 -> 75000
            expr = normalizeNumbers(expr);

            // Evaluasi
            const value = this._evaluate(expr, scope);
            if (value === null) continue;

            // Simpan sebagai variabel jika LHS adalah identifier
            const varMatch = lhs.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
            if (varMatch) {
                scope[varMatch[1]] = value;
            }

            updates.push({ lineIndex: i, value });
        }

        // Sisipkan dari baris paling bawah ke atas agar offset tidak bergeser
        for (let i = updates.length - 1; i >= 0; i--) {
            const { lineIndex, value } = updates[i];
            const iter = buffer.get_iter_at_line(lineIndex);
            iter.forward_to_line_end();

            // Simpan mark di posisi ini (left gravity = true)
            const mark = buffer.create_mark(null, iter, true);
            this._resultMarks.push(mark);

            const formatted = `   = ${this._formatNumber(value)}`;
            const startOffset = iter.get_offset();
            buffer.insert(iter, formatted);

            // Terapkan tag calc_result
            buffer.apply_tag_by_name(
                'calc_result',
                buffer.get_iter_at_offset(startOffset),
                buffer.get_iter_at_offset(startOffset + formatted.length)
            );
        }
    }
});

