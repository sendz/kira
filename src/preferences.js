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

export function presentPreferences(window) {
    const presets = [
        [_('system_default'), ''],
        ['id-ID — Indonesia', 'id-ID'],
        ['en-US — English (United States)', 'en-US'],
        ['en-GB — English (United Kingdom)', 'en-GB'],
        ['de-DE — Deutsch', 'de-DE'],
        ['fr-FR — Français', 'fr-FR'],
        ['es-ES — Español', 'es-ES'],
        ['ja-JP — 日本語', 'ja-JP'],
        ['zh-CN — 中文', 'zh-CN'],
    ];
    const custom = presets.length;

    const dialog = new Adw.PreferencesDialog();
    const page = new Adw.PreferencesPage({ title: _('preferences') });
    const group = new Adw.PreferencesGroup({ title: _('number_format') });

    const combo = new Adw.ComboRow({
        title: _('locale'),
        model: Gtk.StringList.new([...presets.map(([label]) => label), _('custom')]),
    });

    const entry = new Adw.EntryRow({ title: _('custom_locale'), show_apply_button: false });
    const preview = new Adw.ActionRow({ title: _('preview') });

    group.add(combo);
    group.add(entry);
    group.add(preview);
    page.add(group);

    const ratesGroup = new Adw.PreferencesGroup({ title: _('currency_conversion') });
    const ratesSwitch = new Adw.SwitchRow({ title: _('automatic_exchange_rates'), active: ratesEnabled() });
    const ratesRow = new Adw.ActionRow({ title: _('exchange_rates'), subtitle: ratesSubtitle() });
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
    const preset = presets.findIndex(([, value]) => value !== '' && value === current);

    if (preset !== -1)
        combo.set_selected(preset);
    else if (current) {
        combo.set_selected(custom);
        entry.set_text(current);
    }

    entry.set_visible(combo.get_selected() === custom);
    preview.set_subtitle(previewText(current));

    const apply = value => {
        setConfiguredLocale(value);
        preview.set_subtitle(previewText(value));
    };

    combo.connect('notify::selected', () => {
        const index = combo.get_selected();
        const isCustom = index === custom;

        entry.set_visible(isCustom);

        if (!isCustom) {
            entry.set_text('');
            entry.remove_css_class('error');
            apply(presets[index][1]);
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
    return date ? _('updated').format(date) : _('not_available');
}

function previewText(value) {
    const tag = isValidLocale(value) ? value : undefined;
    const number = new Intl.NumberFormat(tag, { maximumFractionDigits: 4 }).format(1234567.89);
    const date = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

    return `${number}    ${date}`;
}
