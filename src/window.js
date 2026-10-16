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

        setupMarkdownTags(this._buffer);
        this._followViewWidth();
        this._buffer.connect('changed', () => this._scheduleRefresh());
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
});
