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

        const h1 = new Gtk.TextTag({
            name: 'h1',
            scale: 1.8,
            weight: 700,
            pixels_above_lines: 12,
            pixels_below_lines: 6,
        });
        tagTable.add(h1);

        const h2 = new Gtk.TextTag({
            name: 'h2',
            scale: 1.4,
            weight: 700,
            pixels_above_lines: 8,
            pixels_below_lines: 4,
        });
        tagTable.add(h2);

        const h3 = new Gtk.TextTag({
            name: 'h3',
            scale: 1.2,
            weight: 700,
            pixels_above_lines: 6,
            pixels_below_lines: 2,
        });
        tagTable.add(h3);
    }

    _applyMarkdown() {
        const buffer = this._buffer;
        const start = buffer.get_start_iter();
        const end = buffer.get_end_iter();

        this._cleanHeadingTags(buffer, start, end);

        this._scanInputs(buffer, start, end)
    }

    _cleanHeadingTags(buffer, start, end) {
        for (const tagName of ['h1', 'h2', 'h3']) {
            buffer.remove_tag_by_name(tagName, start, end);
        }
    }

    _scanInputs(buffer, start, end) {
        const text = buffer.get_text(start, end, true);
        const lines = text.split('\n');

        let offset = 0;
        for (const line of lines) {
            const match = line.match(/^(#{1,3})\s+(.*)$/);
            if (match) {
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

            offset += line.length + 1;
        }
    }
});

