/* markdown.js
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

 import Gtk from 'gi://Gtk?version=4.0';

 export function setupMarkdownTags(buffer) {
    const tagTable = buffer.get_tag_table();
    setupHeadings(buffer, tagTable);
    setupBold(buffer, tagTable);
    setupItalic(buffer, tagTable);
    setupBlockquote(buffer, tagTable);
    setupList(buffer, tagTable);

    const resultTag = new Gtk.TextTag({
      name: 'calc_result',
      foreground: '#1a7f37',
      weight: 700,
    });
    tagTable.add(resultTag);
}

function setupHeadings (buffer, tagTable) {
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

function setupBold(buffer, tagTable) {
    const boldTag = new Gtk.TextTag({
        name: 'bold',
        weight: 700,
    });
    tagTable.add(boldTag);
}

function setupItalic(buffer, tagTable) {
    const italicTag = new Gtk.TextTag({
        name: 'italic',
        style: 2,
    });
    tagTable.add(italicTag);
}

function setupBlockquote(buffer, tagTable) {
    const blockquoteTag = new Gtk.TextTag({
        name: 'blockquote',
        foreground: '#666666',
        style: 2,                  // italic
        left_margin: 24,
    });
    tagTable.add(blockquoteTag);
}

function setupList(buffer, tagTable) {
    const listTag = new Gtk.TextTag({
        name: 'list_item',
        left_margin: 24,
    });
    tagTable.add(listTag);
}
        
