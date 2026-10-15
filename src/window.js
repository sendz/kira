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

export const ScratchPadWindow = GObject.registerClass({
    GTypeName: 'ScratchPadWindow',
    Template: 'resource:///com/sendyyeah/ScratchPad/window.ui',
    InternalChildren: ['text_view'],
}, class ScratchPadWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });

        this._buffer = this._text_view.get_buffer();

        this._setupTags();

        this._buffer.connect('changed', () => {
            this._applyMarkdown();
        })
    }

    _setupTags() {
        const buffer = this._buffer;
        const tagTable = buffer.get_tag_table();
        this._setupHeadings(buffer, tagTable);
        this._setupBold(buffer, tagTable);
        this._setupItalic(buffer, tagTable);
    }

    _setupHeadings (buffer, tagTable) {
        const headings = [
            { name: 'h1', scale: 2, above: 14, below: 8 },
            { name: 'h2', scale: 1.8, above: 12, below: 6 },
            { name: 'h3', scale: 1.6, above: 10, below: 5 },
            { name: 'h4', scale: 1.4, above: 8, below: 4 },
            { name: 'h5', scale: 1.2, above: 6, below: 3 },
            { name: 'h6', scale: 1, above: 4, below: 2 },
        ];

        for (const h of headings) {
            const tag = new Gtk.TextTag({
                name: h.name,
                scale: h.scale,
                weight: 700,
                pixels_above_lines: h.above,
                pixels_below_lines: h.below,
            });
            tagTable.add(tag);
        }

        const h6 = tagTable.lookup('h6');
        if (h6) {
            h6.set_property('foreground', '#888888');
            h6.set_property('style', 2);
        }
    }

    _setupBold(buffer, tagTable) {
        const boldTag = new Gtk.TextTag({
            name: 'bold',
            weight: 700,
        });
        tagTable.add(boldTag);
    }

    _setupItalic(buffer, tagTable) {
        const italicTag = new Gtk.TextTag({
            name: 'italic',
            style: 2,
        });
        tagTable.add(italicTag);
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
    }

    _scanInputs(buffer, start, end) {
        const text = buffer.get_text(start, end, true);
        const lines = text.split('\n');

        let offset = 0;
        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (headingMatch) {
                const level = match[1].length;
                const contentStart = offset + level + 1;
                const contentEnd = offset + line.length;

                if (contentEnd > contentStart) {
                    buffer.apply_tag_by_name(
                        `h${level}`,
                        buffer.get_iter_at_offset(contentStart),
                        buffer.get_iter_at_offset(contentEnd)
                    );
                }
            }

            const boldRegex = /\*\*(.+?)\*\*/g;
            let match;
            while ((match = boldRegex.exec(line)) !== null) {
                const contentStart = offset + match.index + 2;
                const contentEnd = contentStart + match[1].length;
                buffer.apply_tag_by_name(
                    'bold',
                    buffer.get_iter_at_offset(contentStart),
                    buffer.get_iter_at_offset(contentEnd)
                );
            }

            const italicRegex = /(?<![\w_])_([^_\n]+?)_(?![\w_])/g;
            while ((match = italicRegex.exec(line)) !== null) {
                const contentStart = offset + match.index + 1;
                const contentEnd = contentStart + match[1].length;
                buffer.apply_tag_by_name(
                    'italic',
                    buffer.get_iter_at_offset(contentStart),
                    buffer.get_iter_at_offset(contentEnd)
                );
            }

            offset += line.length + 1;
        }
    }
});

