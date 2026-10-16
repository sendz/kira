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
import Pango from 'gi://Pango';

export function setupMarkdownTags(buffer) {
    const tagTable = buffer.get_tag_table();

    setupHeadings(tagTable);
    setupBold(tagTable);
    setupItalic(tagTable);
    setupBlockquote(tagTable);
    setupList(tagTable);

    tagTable.add(new Gtk.TextTag({
        name: 'calc_result',
        foreground: '#1a7f37',
        weight: Pango.Weight.BOLD,
    }));
    tagTable.add(new Gtk.TextTag({ name: 'calc_line' }));
}

export function setResultTabStop(buffer, pixels) {
    const tag = buffer.get_tag_table().lookup('calc_line');
    if (!tag)
        return;

    const tabs = Pango.TabArray.new(1, false);
    tabs.set_tab(0, Pango.TabAlign.RIGHT, Math.max(1, Math.round(pixels)) * Pango.SCALE);
    tag.set_property('tabs', tabs);
}

function setupHeadings(tagTable) {
    const headings = [
        { name: 'h1', scale: 2, above: 14, below: 8 },
        { name: 'h2', scale: 1.8, above: 12, below: 6 },
        { name: 'h3', scale: 1.6, above: 10, below: 5 },
        { name: 'h4', scale: 1.4, above: 8, below: 4 },
        { name: 'h5', scale: 1.2, above: 6, below: 3 },
        { name: 'h6', scale: 1, above: 4, below: 2 },
    ];

    for (const heading of headings) {
        tagTable.add(new Gtk.TextTag({
            name: heading.name,
            scale: heading.scale,
            weight: Pango.Weight.BOLD,
            pixels_above_lines: heading.above,
            pixels_below_lines: heading.below,
        }));
    }

    const h6 = tagTable.lookup('h6');
    if (h6) {
        h6.set_property('foreground', '#888888');
        h6.set_property('style', Pango.Style.ITALIC);
    }
}

function setupBold(tagTable) {
    tagTable.add(new Gtk.TextTag({ name: 'bold', weight: Pango.Weight.BOLD }));
}

function setupItalic(tagTable) {
    tagTable.add(new Gtk.TextTag({ name: 'italic', style: Pango.Style.ITALIC }));
}

function setupBlockquote(tagTable) {
    tagTable.add(new Gtk.TextTag({
        name: 'blockquote',
        foreground: '#666666',
        style: Pango.Style.ITALIC,
        left_margin: 24,
    }));
}

function setupList(tagTable) {
    tagTable.add(new Gtk.TextTag({ name: 'list_item', left_margin: 24 }));
}

export function applyMarkdown(buffer) {
    const start = buffer.get_start_iter();
    const end = buffer.get_end_iter();

    clearTags(buffer, start, end);
    scanInputs(buffer, start, end);
}

function clearTags(buffer, start, end) {
    for (let level = 1; level <= 6; level++)
        buffer.remove_tag_by_name(`h${level}`, start, end);

    for (const name of ['bold', 'italic', 'blockquote', 'list_item'])
        buffer.remove_tag_by_name(name, start, end);
}

function scanInputs(buffer, start, end) {
    let offset = 0;

    for (const line of buffer.get_text(start, end, true).split('\n')) {
        const lineStart = offset;
        const lineEnd = offset + line.length;
        offset += line.length + 1;

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            const level = heading[1].length;
            const contentStart = lineStart + level + 1;
            if (lineEnd > contentStart)
                applyTag(buffer, `h${level}`, contentStart, lineEnd);
            continue;
        }

        if (/^>/.test(line)) {
            applyTag(buffer, 'blockquote', lineStart, lineEnd);
            continue;
        }

        const listItem = line.match(/^(\s*)([-*+])\s+(.*)$/);
        if (listItem) {
            applyTag(buffer, 'list_item', lineStart, lineEnd);
            applyInlineTags(buffer, lineStart + listItem[0].length - listItem[3].length, listItem[3]);
            continue;
        }

        applyInlineTags(buffer, lineStart, line);
    }
}

function applyTag(buffer, name, startOffset, endOffset) {
    buffer.apply_tag_by_name(name,
        buffer.get_iter_at_offset(startOffset),
        buffer.get_iter_at_offset(endOffset));
}

function applyInlineTags(buffer, lineStart, lineText) {
    for (const match of lineText.matchAll(/\*\*(.+?)\*\*/g))
        applyTag(buffer, 'bold',
            lineStart + match.index + 2,
            lineStart + match.index + 2 + match[1].length);

    for (const match of lineText.matchAll(/(?<![\w_])_([^_\n]+?)_(?![\w_])/g))
        applyTag(buffer, 'italic',
            lineStart + match.index + 1,
            lineStart + match.index + 1 + match[1].length);
}

export function stripMarkdown(s) {
    return s
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/(?<![\w_])_([^_\n]+?)_(?![\w_])/g, '$1')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/`([^`]+?)`/g, '$1');
}
