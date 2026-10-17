/* preferences.js
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

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { configuredLocale, setConfiguredLocale, isValidLocale } from './helpers/locale.js';
import { ratesEnabled, setRatesEnabled, rateDate, onRatesChange, refresh as refreshRates } from './helpers/rates.js';

const PRESETS = [
    ['System default', ''],
    ['id-ID — Indonesia', 'id-ID'],
    ['en-US — English (United States)', 'en-US'],
    ['en-GB — English (United Kingdom)', 'en-GB'],
    ['de-DE — Deutsch', 'de-DE'],
    ['fr-FR — Français', 'fr-FR'],
    ['es-ES — Español', 'es-ES'],
    ['ja-JP — 日本語', 'ja-JP'],
    ['zh-CN — 中文', 'zh-CN'],
];

const CUSTOM = PRESETS.length;

export function presentPreferences(window) {
    const dialog = new Adw.PreferencesDialog();
    const page = new Adw.PreferencesPage({ title: 'Preferences' });
    const group = new Adw.PreferencesGroup({ title: 'Number format' });

    const combo = new Adw.ComboRow({
        title: 'Locale',
        model: Gtk.StringList.new([...PRESETS.map(([label]) => label), 'Custom…']),
    });

    const entry = new Adw.EntryRow({ title: 'Custom locale', show_apply_button: false });
    const preview = new Adw.ActionRow({ title: 'Preview' });

    group.add(combo);
    group.add(entry);
    group.add(preview);
    page.add(group);

    const ratesGroup = new Adw.PreferencesGroup({ title: 'Currency conversion' });
    const ratesSwitch = new Adw.SwitchRow({ title: 'Automatic exchange rates', active: ratesEnabled() });
    const ratesRow = new Adw.ActionRow({ title: 'Exchange rates', subtitle: ratesSubtitle() });
    const refreshButton = new Gtk.Button({ icon_name: 'view-refresh-symbolic', valign: Gtk.Align.CENTER });

    refreshButton.add_css_class('flat');
    ratesRow.add_suffix(refreshButton);
    ratesGroup.add(ratesSwitch);
    ratesGroup.add(ratesRow);
    page.add(ratesGroup);

    ratesSwitch.connect('notify::active', () => setRatesEnabled(ratesSwitch.get_active()));
    refreshButton.connect('clicked', () => refreshRates(true));

    const offRates = onRatesChange(() => ratesRow.set_subtitle(ratesSubtitle()));
    dialog.connect('closed', () => offRates());

    dialog.add(page);

    const current = configuredLocale();
    const preset = PRESETS.findIndex(([, value]) => value !== '' && value === current);

    if (preset !== -1)
        combo.set_selected(preset);
    else if (current) {
        combo.set_selected(CUSTOM);
        entry.set_text(current);
    }

    entry.set_visible(combo.get_selected() === CUSTOM);
    preview.set_subtitle(previewText(current));

    const apply = value => {
        setConfiguredLocale(value);
        preview.set_subtitle(previewText(value));
    };

    combo.connect('notify::selected', () => {
        const index = combo.get_selected();
        const custom = index === CUSTOM;

        entry.set_visible(custom);

        if (!custom) {
            entry.set_text('');
            entry.remove_css_class('error');
            apply(PRESETS[index][1]);
        }
    });

    entry.connect('changed', () => {
        const value = entry.get_text().trim();
        const valid = value === '' || isValidLocale(value);

        entry[valid ? 'remove_css_class' : 'add_css_class']('error');

        if (valid)
            apply(value);
    });

    dialog.present(window);
}

function ratesSubtitle() {
    const date = rateDate();
    return date ? `Updated ${date}` : 'Not available yet';
}

function previewText(value) {
    const tag = isValidLocale(value) ? value : undefined;
    const number = new Intl.NumberFormat(tag, { maximumFractionDigits: 4 }).format(1234567.89);
    const date = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

    return `${number}    ${date}`;
}
