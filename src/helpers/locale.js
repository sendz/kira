/* locale.js
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

import Gio from 'gi://Gio';

const settings = new Gio.Settings({ schema_id: 'com.sendyyeah.ScratchPad' });

let override = '';

export function locale() {
    const configured = settings.get_string('number-format-locale');

    return override
        || (isValidLocale(configured) ? configured : '')
        || Intl.DateTimeFormat().resolvedOptions().locale;
}

export function separators() {
    const parts = new Intl.NumberFormat(locale()).formatToParts(12345.6);
    const value = type => parts.find(part => part.type === type)?.value ?? '';

    return { group: value('group'), decimal: value('decimal') || '.' };
}

export function setLocaleOverride(tag) {
    override = isValidLocale(tag) ? tag : '';
}

export function configuredLocale() {
    return settings.get_string('number-format-locale');
}

export function setConfiguredLocale(tag) {
    settings.set_string('number-format-locale', tag);
}

export function onLocaleChange(callback) {
    settings.connect('changed::number-format-locale', callback);
}

export function isValidLocale(tag) {
    if (!tag)
        return false;

    try {
        new Intl.NumberFormat(tag);
        return true;
    } catch (e) {
        return false;
    }
}
