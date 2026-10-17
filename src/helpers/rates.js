/* rates.js
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
import GLib from 'gi://GLib';
import Soup from 'gi://Soup?version=3.0';

const ENDPOINT = 'https://api.frankfurter.dev/v1/latest?base=USD';
const CACHE_DIR = GLib.build_filenamev([GLib.get_user_cache_dir(), 'com.sendyyeah.Kira']);
const CACHE_FILE = GLib.build_filenamev([CACHE_DIR, 'rates.json']);
const MAX_AGE = 24 * 60 * 60 * 1000;

let settings = null;
let table = null;
let fetching = false;
let listeners = [];

export function convertWith(rates, value, from, to) {
    const source = rates[from.toUpperCase()];
    const target = rates[to.toUpperCase()];

    if (source === undefined || target === undefined)
        return null;

    return value * target / source;
}

export function convertCurrency(value, from, to) {
    return convertWith(load().rates, value, from, to);
}

export function normalizeRates(payload) {
    return {
        base: 'USD',
        date: payload.date ?? null,
        fetchedAt: Date.now(),
        rates: { USD: 1, ...payload.rates },
    };
}

export function setRates(rates, date = null) {
    table = { base: 'USD', date, fetchedAt: Date.now(), rates: { USD: 1, ...rates } };
}

export function rateDate() {
    return load().date;
}

export async function refresh(force = false) {
    if (fetching || (!force && !enabled()))
        return;

    load();

    if (!force && Date.now() - table.fetchedAt < MAX_AGE)
        return;

    fetching = true;
    try {
        table = normalizeRates(await fetchRates());
        writeCache();
        for (const listener of listeners)
            listener();
    } catch (e) {
        console.error('Exchange rates update failed:', e);
    } finally {
        fetching = false;
    }
}

export function ratesEnabled() {
    return enabled();
}

export function setRatesEnabled(value) {
    config().set_boolean('currency-rates-enabled', value);
}

export function onRatesChange(callback) {
    listeners.push(callback);

    return () => {
        listeners = listeners.filter(listener => listener !== callback);
    };
}

function enabled() {
    return config().get_boolean('currency-rates-enabled');
}

function load() {
    if (table)
        return table;

    table = readCache() ?? { base: 'USD', date: null, fetchedAt: 0, rates: { USD: 1 } };
    return table;
}

function readCache() {
    try {
        const [, contents] = GLib.file_get_contents(CACHE_FILE);
        const cached = JSON.parse(new TextDecoder().decode(contents));

        return cached.rates ? cached : null;
    } catch (e) {
        return null;
    }
}

function writeCache() {
    try {
        GLib.mkdir_with_parents(CACHE_DIR, 0o755);
        GLib.file_set_contents(CACHE_FILE, JSON.stringify(table));
    } catch (e) {
        console.error('Could not cache exchange rates:', e);
    }
}

function fetchRates() {
    return new Promise((resolve, reject) => {
        const session = new Soup.Session();
        const message = Soup.Message.new('GET', ENDPOINT);

        session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (self, result) => {
            try {
                const bytes = self.send_and_read_finish(result);

                if (message.get_status() !== Soup.Status.OK)
                    throw new Error(`HTTP ${message.get_status()}`);

                resolve(JSON.parse(new TextDecoder().decode(bytes.get_data())));
            } catch (e) {
                reject(e);
            }
        });
    });
}

function config() {
    if (!settings)
        settings = new Gio.Settings({ schema_id: 'com.sendyyeah.Kira' });

    return settings;
}
