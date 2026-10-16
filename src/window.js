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
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { setupMarkdownTags, applyMarkdown, stripMarkdown } from './helpers/markdown.js';
import { clearResults, evaluate } from './helpers/calculator.js';
import { normalizeNumbers, formatNumber } from './helpers/format.js';

export const ScratchPadWindow = GObject.registerClass({
    GTypeName: 'ScratchPadWindow',
    Template: 'resource:///com/sendyyeah/ScratchPad/window.ui',
    InternalChildren: ['text_view'],
}, class ScratchPadWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });

        this._buffer = this._text_view.get_buffer();
        this._isUpdating = false;
        this._refreshScheduled = false;
        this._results = [];

        setupMarkdownTags(this._buffer);

        this._buffer.connect('changed', () => {
            if (this._isUpdating || this._refreshScheduled) return;

            this._refreshScheduled = true;
            GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                this._refreshScheduled = false;
                this._refresh();
                return GLib.SOURCE_REMOVE;
            });
        })
    }

    _refresh() {
        if (this._isUpdating) return;

        const buffer = this._buffer;
        this._isUpdating = true;

        try {
            const caret = buffer.create_mark(
                null,
                buffer.get_iter_at_mark(buffer.get_insert()),
                true
            );

            clearResults(buffer, this._results);
            applyMarkdown(buffer);
            this._insertResults();

            buffer.place_cursor(buffer.get_iter_at_mark(caret));
            buffer.delete_mark(caret);
        } finally {
            this._isUpdating = false;
        }
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

            // Skip empty lines, heading, blockquote
            if (!line.trim()) continue;
            if (/^#{1,6}\s/.test(line)) continue;
            if (/^>/.test(line)) continue;

            const eqIndex = line.indexOf('=');
            if (eqIndex === -1) continue;

            const lhs = line.substring(0, eqIndex).trim();
            const rhs = line.substring(eqIndex + 1).trim();
            if (!rhs) continue;

            // Clear markdown from RHS
            let expr = stripMarkdown(rhs);

            // Normalize Indonesia number format before calculate: 75.000 -> 75000
            expr = normalizeNumbers(expr);

            const value = evaluate(expr, scope);
            if (value === null) continue;

            // Save as variable if LHS is identifier
            const varMatch = lhs.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
            if (varMatch) {
                scope[varMatch[1]] = value;
            }

            updates.push({ lineIndex: i, value });
        }

        for (let i = updates.length - 1; i >= 0; i--) {
            const { lineIndex, value } = updates[i];
            const [ok, iter] = buffer.get_iter_at_line(lineIndex);

            if (!ok) continue;
            iter.forward_to_line_end();

            const formatted = `   = ${formatNumber(value)}`;
            const startOffset = iter.get_offset();

            buffer.insert(iter, formatted, -1);

            const start = buffer.create_mark(null,
                buffer.get_iter_at_offset(startOffset), false);
            const end = buffer.create_mark(null,
                buffer.get_iter_at_offset(startOffset + formatted.length), true);
            this._results.push({ start, end });

            buffer.apply_tag_by_name(
                'calc_result',
                buffer.get_iter_at_offset(startOffset),
                buffer.get_iter_at_offset(startOffset + formatted.length)
            );
        }
    }
});

