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
import { setLocaleOverride, configuredLocale, isValidLocale, onLocaleChange } from './helpers/locale.js';
import { readLocale, writeLocale } from './helpers/metadata.js';

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
        this._isModified = false;
        this._afterSave = null;

        setupMarkdownTags(this._buffer);
        this._followViewWidth();
        onLocaleChange(() => this._scheduleRefresh());
        this._buffer.connect('changed', () => {
            if (this._isUpdating)
                return;

            this._isModified = true;
            this._scheduleRefresh();
        });
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

        setLocaleOverride(readLocale(this._text()));
        this._isUpdating = true;

        this._updateTitle();
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

    vfunc_close_request() {
        if (!this._isModified)
            return false;

        this._guardUnsaved(() => this.destroy());
        return true;
    }

    _guardUnsaved(onProceed) {
        if (!this._isModified) {
            onProceed();
            return;
        }

        const dialog = new Adw.MessageDialog({
            transient_for: this,
            modal: true,
            heading: 'Save changes?',
            body: this._currentFile
                ? `Save changes to “${this._currentFile.get_basename()}” before continuing?`
                : 'Save your changes before continuing?',
        });
        dialog.add_response('cancel', 'Cancel');
        dialog.add_response('discard', 'Discard');
        dialog.add_response('save', 'Save');
        dialog.set_response_appearance('discard', Adw.ResponseAppearance.DESTRUCTIVE);
        dialog.set_response_appearance('save', Adw.ResponseAppearance.SUGGESTED);
        dialog.set_default_response('save');
        dialog.set_close_response('cancel');

        dialog.connect('response', (_dialog, response) => {
            if (response === 'discard') {
                this._isModified = false;
                onProceed();
            } else if (response === 'save') {
                this._afterSave = onProceed;
                this.saveFile();
            }
        });
        dialog.present();
    }

    // New File
    newFile() {
        this._guardUnsaved(() => {
            this._currentFile = null;
            this._buffer.set_text('', -1);
            this._isModified = false;
            this._updateTitle();
        });
    }

    // Open File
    openFile() {
        this._guardUnsaved(() => this._openFileDialog());
    }

    _openFileDialog() {
        const dialog = new Gtk.FileDialog();
        dialog.set_title('Open File');

        // Filter: Only show .txt, .md, .numi file
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
                this._afterSave = null;
                if (!e.matches?.(Gtk.DialogError, Gtk.DialogError.DISMISSED))
                    console.error('Save As failed:', e);
            }
        });
    }

    _text() {
        const buffer = this._buffer;
        return buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), true);
    }

    _applyText(next) {
        const buffer = this._buffer;
        const current = this._text();

        if (current === next)
            return;

        let head = 0;
        while (head < current.length && head < next.length && current[head] === next[head])
            head++;

        let tail = 0;
        while (tail < current.length - head && tail < next.length - head &&
               current[current.length - 1 - tail] === next[next.length - 1 - tail])
            tail++;

        const start = buffer.get_iter_at_offset(head);
        const end = buffer.get_iter_at_offset(current.length - tail);
        buffer.delete(start, end);
        buffer.insert(buffer.get_iter_at_offset(head), next.substring(head, next.length - tail), -1);
    }

    _embedLocale() {
        const text = this._text();
        const embedded = readLocale(text);
        const value = isValidLocale(embedded) ? embedded : configuredLocale();

        if (isValidLocale(value))
            this._applyText(writeLocale(text, value));
    }

    _writeFile(file) {
        this._embedLocale();

        const bytes = new TextEncoder().encode(this._text());

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

                    const afterSave = this._afterSave;
                    this._afterSave = null;
                    if (afterSave)
                        afterSave();
                } catch (e) {
                    console.error('Write failed:', e);
                }
            }
        );
    }
});
