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
 import Pango from 'gi://Pango'

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
      weight: Pango.Weight.BOLD,
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
            weight: Pango.Weight.BOLD,
            pixels_above_lines: h.above,
            pixels_below_lines: h.below,
        });
        tagTable.add(tag);
    }

    const h6 = tagTable.lookup('h6');
    if (h6) {
        h6.set_property('foreground', '#888888');
        h6.set_property('style', Pango.Style.ITALIC);
    }
}

function setupBold(buffer, tagTable) {
    const boldTag = new Gtk.TextTag({
        name: 'bold',
        weight: Pango.Weight.BOLD,
    });
    tagTable.add(boldTag);
}

function setupItalic(buffer, tagTable) {
    const italicTag = new Gtk.TextTag({
        name: 'italic',
        style: Pango.Style.ITALIC,
    });
    tagTable.add(italicTag);
}

function setupBlockquote(buffer, tagTable) {
    const blockquoteTag = new Gtk.TextTag({
        name: 'blockquote',
        foreground: '#666666',
        style: Pango.Style.ITALIC,
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

export function applyMarkdown(buffer) {
    const start = buffer.get_start_iter();
    const end = buffer.get_end_iter();

    cleanTags(buffer, start, end);

    scanInputs(buffer, start, end)
}

function cleanTags(buffer, start, end) {
    for (let i = 1; i <= 6; i++) {
        buffer.remove_tag_by_name(`h${i}`, start, end);
    }

    buffer.remove_tag_by_name('bold', start, end);
    buffer.remove_tag_by_name('italic', start, end);
    buffer.remove_tag_by_name('blockquote', start, end);
    buffer.remove_tag_by_name('list_item', start, end);
}

function scanInputs(buffer, start, end) {
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

        // --- Blockquote: > text ---
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
            applyInlineTags(buffer, lineStart + listMatch[0].length - listMatch[3].length,
                                  listMatch[3]);
            offset += line.length + 1;
            continue;
        }

        // --- Inline tags: bold & italic ---
        applyInlineTags(buffer, lineStart, line);
        offset += line.length + 1;
    }
}

function applyInlineTags(buffer, lineStart, lineText) {
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

export function stripMarkdown(s) {
    return s
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/(?<![\w_])_([^_\n]+?)_(?![\w_])/g, '$1')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/`([^`]+?)`/g, '$1');
}
