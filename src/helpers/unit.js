/* unit.js
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

const LENGTH = {
    m:      [1,          ['meter', 'meters']],
    km:     [1000,       ['kilometer', 'kilometers']],
    cm:     [0.01,       ['centimeter', 'centimeters']],
    mm:     [0.001,      ['millimeter', 'millimeters']],
    miles:  [1609.344,   ['mile', 'mi']],
    ft:     [0.3048,     ['feet', 'foot']],
    inch:   [0.0254,     ['inches', 'in']],
    yard:   [0.9144,     ['yards', 'yd']],
}

const MASS = {
    kg:     [1,          ['kilogram', 'kilograms']],
    g:      [0.001,      ['gram', 'grams']],
    mg:     [0.000001,   ['milligram', 'milligrams']],
    lbs:    [0.453592,   ['lb', 'pound', 'pounds']],
    oz:     [0.0283495,  ['ounce', 'ounces']],
    ton:    [1000,       ['tons', 'tonne']],
}

const VOLUME = {
    l:      [1,          ['liter', 'liters', 'litre', 'litres']],
    ml:     [0.001,      ['milliliter', 'milliliters']],
    gal:    [3.78541,    ['gallon', 'gallons']],
    cup:    [0.236588,   ['cups']],
}

const TIME = {
    s:      [1,          ['sec', 'second', 'seconds']],
    min:    [60,         ['minute', 'minutes']],
    hour:   [3600,       ['hours', 'h', 'hr']],
    day:    [86400,      ['days']],
}

const TEMPERATURE = ['c', 'f', 'k', 'celsius', 'fahrenheit', 'kelvin'];

const UNIT_MAP = {};

function registerCategory(category, table) {
    for (const [unit, [factor, aliases]] of Object.entries(table)) {
        UNIT_MAP[unit.toLowerCase()] = { category, unit, factor };
        for (const alias of aliases) {
            UNIT_MAP[alias.toLowerCase()] = { category, unit, factor };
        }
    }
}

registerCategory('length', LENGTH);
registerCategory('mass', MASS);
registerCategory('volume', VOLUME);
registerCategory('time', TIME);

export function isUnit(word) {
    if (!word) return false;
    const w = word.toLowerCase();

    if (UNIT_MAP[w]) return true;
    if (TEMPERATURE.includes(w)) return true;

    return false;
}

export function convertUnit(value, from, to) {
    const f = from.toLowerCase();
    const t = to.toLowerCase();

    if (TEMPERATURE.includes(f) || TEMPERATURE.includes(t)) {
        return convertTemperature(value, f, t);
    };

    const source = UNIT_MAP[f];
    const target = UNIT_MAP[t];

    if (!source || !target) return null;

    if (source.category !== target.category) return null;

    const baseValue = value * source.factor;
    return baseValue / target.factor;
}

function convertTemperature(value, from, to) {
    const normalize = (unit) => {
        if (!unit || !TEMPERATURE.includes(unit)) return null;
        if (unit === 'celsius') return 'c';
        if (unit === 'fahrenheit') return 'f';
        if (unit === 'kelvin') return 'k';
        return unit;
    }

    const f = normalize(from);
    const t = normalize(to);

    if (!f || !t) return null;

    // Convert to Celsius first
    let celsius;
    if (f === 'c') celsius = value;
    else if (f === 'f') celsius = (value - 32) * 5 / 9;
    else if (f === 'k') celsius = value - 273.15;
    else return null;

    // From Celsius to target
    if (t === 'c') return celsius;
    if (t === 'f') return celsius * 9 / 5 + 32;
    if (t === 'k') return celsius + 273.15;
    return null;
}

