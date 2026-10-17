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
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { setupMarkdownTags, applyMarkdown, setResultTabStop } from './helpers/markdown.js';
import { clearResults, insertResults } from './helpers/calculator.js';

export const ScratchPadWindow = GObject.registerClass({
    GTypeName: 'ScratchPadWindow',
    Template: 'resource:///com/sendyyeah/ScratchPad/window.ui',
    InternalChildren: ['text_view'],
}, class ScratchPadWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });

        this._buffer = this._text_view.get_buffer();
        this._results = [];
        this._isUpdating = false;
        this._refreshScheduled = false;
        this._tabStopScheduled = false;
        this._pendingTabWidth = 0;
        this._currentFile = null;

        setupMarkdownTags(this._buffer);
        this._followViewWidth();
        this._buffer.connect('changed', () => this._scheduleRefresh());
        this._updateTitle();
    }

    _updateTitle() {
        let name = 'Scratch Pad';
        if (this._currentFile) {
            name = this._currentFile.get_basename();
        }
        if (this._isModified) {
            name = `• ${name}`;
        }
        this.set_title(name);
    }

    _followViewWidth() {
        const adjustment = this._text_view.get_hadjustment();
        if (adjustment)
            adjustment.connect('notify::page-size', () =>
                this._scheduleTabStop(adjustment.get_page_size()));
    }

    _scheduleRefresh() {
        if (this._isUpdating || this._refreshScheduled)
            return;

        this._refreshScheduled = true;
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._refreshScheduled = false;
            this._refresh();
            return GLib.SOURCE_REMOVE;
        });
    }

    _refresh() {
        const buffer = this._buffer;
        const caret = buffer.create_mark(null, buffer.get_iter_at_mark(buffer.get_insert()), true);

        this._isUpdating = true;
        try {
            clearResults(buffer, this._results);
            applyMarkdown(buffer);
            insertResults(buffer, this._results);
        } finally {
            this._isUpdating = false;
        }

        buffer.place_cursor(buffer.get_iter_at_mark(caret));
        buffer.delete_mark(caret);
    }

    _scheduleTabStop(viewWidth) {
        const margins = this._text_view.get_left_margin() + this._text_view.get_right_margin();
        this._pendingTabWidth = viewWidth - margins;

        if (this._pendingTabWidth <= 0 || this._tabStopScheduled)
            return;

        this._tabStopScheduled = true;
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._tabStopScheduled = false;
            setResultTabStop(this._buffer, this._pendingTabWidth);
            return GLib.SOURCE_REMOVE;
        });
    }

    // New File
    newFile() {
        this._currentFile = null;
        this._isModified = false;
        this._buffer.set_text('', -1);
        this._updateTitle();
    }

    // Open File
    openFile() {
        const dialog = new Gtk.FileDialog();
        dialog.set_title('Open File');

        // Filter: hanya tampilkan file .txt, .md, .numi
        const filter = new Gtk.FileFilter();
        filter.set_name('Text files');
        filter.add_pattern('*.txt');
        filter.add_pattern('*.md');
        filter.add_pattern('*.numi');
        filter.add_pattern('*');

        const filters = new Gio.ListStore({ item_type: Gtk.FileFilter.$gtype });
        filters.append(filter);
        dialog.set_filters(filters);

        dialog.open(this, null, (source, result) => {
            try {
                const file = source.open_finish(result);
                this._loadFile(file);
            } catch (e) {
                // User cancel: tidak apa-apa
                if (!e.matches?.(Gtk.DialogError, Gtk.DialogError.DISMISSED))
                    console.error('Open failed:', e);
            }
        });
    }

    _loadFile(file) {
        file.load_contents_async(null, (source, result) => {
            try {
                const [success, contents] = source.load_contents_finish(result);
                if (!success) return;

                const text = new TextDecoder().decode(contents);
                this._buffer.set_text(text, -1);
                this._currentFile = file;
                this._isModified = false;
                this._updateTitle();
            } catch (e) {
                console.error('Load failed:', e);
            }
        });
    }

    saveFile() {
        if (this._currentFile) {
            this._writeFile(this._currentFile);
        } else {
            this.saveFileAs();
        }
    }

    saveFileAs() {
        const dialog = new Gtk.FileDialog();
        dialog.set_title('Save File');
        dialog.set_initial_name(
            this._currentFile
                ? this._currentFile.get_basename()
                : 'Untitled.md'
        );

        dialog.save(this, null, (source, result) => {
            try {
                const file = source.save_finish(result);
                this._writeFile(file);
            } catch (e) {
                if (!e.matches?.(Gtk.DialogError, Gtk.DialogError.DISMISSED))
                    console.error('Save As failed:', e);
            }
        });
    }

    _writeFile(file) {
        const start = this._buffer.get_start_iter();
        const end = this._buffer.get_end_iter();
        const text = this._buffer.get_text(start, end, true);

        const bytes = new TextEncoder().encode(text);

        file.replace_contents_async(
            bytes,
            null,           // etag
            false,          // make_backup
            Gio.FileCreateFlags.REPLACE_DESTINATION,
            null,
            (source, result) => {
                try {
                    source.replace_contents_finish(result);
                    this._currentFile = file;
                    this._isModified = false;
                    this._updateTitle();
                } catch (e) {
                    console.error('Write failed:', e);
                }
            }
        );
    }
});
