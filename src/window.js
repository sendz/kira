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

import {setupMarkdownTags} from './markdown.js'

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
                this._clearResults();
                this._applyMarkdown();
                this._insertResults();
            } finally {
                this._isUpdating = false;
            }
        })
    }

    _clearResults() {
        const buffer = this._buffer;

        for (const mark of this._resultMarks) {
            const iter = buffer.get_iter_at_mark(mark);
            const endIter = iter.copy();
            endIter.forward_to_line_end();

            buffer.delete(iter, endIter);
            buffer.delete_mark(mark);
        }
        this._resultMarks = [];
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
            let expr = this._stripMarkdown(rhs);

            // Normalisasi angka Indonesia: 75.000 -> 75000
            expr = this._normalizeNumbers(expr);

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

    _applyMarkdown() {
        const buffer = this._buffer;
        const start = buffer.get_start_iter();
        const end = buffer.get_end_iter();

        this._cleanTags(buffer, start, end);

        this._scanInputs(buffer, start, end)
    }

    _cleanTags(buffer, start, end) {
        for (let i = 1; i <= 6; i++) {
            buffer.remove_tag_by_name(`h${i}`, start, end);
        }

        buffer.remove_tag_by_name('bold', start, end);
        buffer.remove_tag_by_name('italic', start, end);
        buffer.remove_tag_by_name('blockquote', start, end);
        buffer.remove_tag_by_name('list_item', start, end);
    }

    _scanInputs(buffer, start, end) {
        const text = buffer.get_text(start, end, true);
    const lines = text.split('\n');

    let offset = 0;
    for (const line of lines) {
        const lineStart = offset;
        const lineEnd = offset + line.length;

        // --- Heading ---
        const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (hMatch) {
            const level = hMatch[1].length;
            const contentStart = offset + level + 1;
            if (lineEnd > contentStart) {
                buffer.apply_tag_by_name(
                    `h${level}`,
                    buffer.get_iter_at_offset(contentStart),
                    buffer.get_iter_at_offset(lineEnd)
                );
            }
            offset += line.length + 1;
            continue;
        }

        // --- Blockquote: > teks ---
        const bqMatch = line.match(/^>\s?(.*)$/);
        if (bqMatch) {
            buffer.apply_tag_by_name(
                'blockquote',
                buffer.get_iter_at_offset(lineStart),
                buffer.get_iter_at_offset(lineEnd)
            );
            offset += line.length + 1;
            continue;   // skip inline parsing di baris quote
        }

        // --- List: - item, * item, + item ---
        const listMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
        if (listMatch) {
            buffer.apply_tag_by_name(
                'list_item',
                buffer.get_iter_at_offset(lineStart),
                buffer.get_iter_at_offset(lineEnd)
            );
            // Inline parsing tetap dilakukan pada isi list
            this._applyInlineTags(lineStart + listMatch[0].length - listMatch[3].length,
                                  listMatch[3]);
            offset += line.length + 1;
            continue;
        }

        // --- Baris biasa: bold & italic ---
        this._applyInlineTags(lineStart, line);
        offset += line.length + 1;
    }
    }

    _applyInlineTags(lineStart, lineText) {
        const buffer = this._buffer;

        // Bold: **teks**
        const boldRegex = /\*\*(.+?)\*\*/g;
        let match;
        while ((match = boldRegex.exec(lineText)) !== null) {
            const contentStart = lineStart + match.index + 2;
            const contentEnd = contentStart + match[1].length;
            buffer.apply_tag_by_name(
                'bold',
                buffer.get_iter_at_offset(contentStart),
                buffer.get_iter_at_offset(contentEnd)
            );
        }

        // Italic: _teks_
        const italicRegex = /(?<![\w_])_([^_\n]+?)_(?![\w_])/g;
        while ((match = italicRegex.exec(lineText)) !== null) {
            const contentStart = lineStart + match.index + 1;
            const contentEnd = contentStart + match[1].length;
            buffer.apply_tag_by_name(
                'italic',
                buffer.get_iter_at_offset(contentStart),
                buffer.get_iter_at_offset(contentEnd)
            );
        }
    }
});

