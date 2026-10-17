/* datetime.js
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

const DAY_MS = 24 * 60 * 60 * 1000;

const KEYWORDS = {
    today: 'today',
    now: 'now',
    tomorrow: 'tomorrow',
    yesterday: 'yesterday',
};

const TIME_UNITS = {
    day: 'days',
    days: 'days',
    week: 'weeks',
    weeks: 'weeks',
    month: 'months',
    months: 'months',
    year: 'years',
    years: 'years',
    hour: 'hours',
    hours: 'hours',
    minute: 'minutes',
    minutes: 'minutes',
    second: 'seconds',
    seconds: 'seconds',
};

export function isDateKeyword(word) {
    if (!word) return false;
    return KEYWORDS[word.trim().toLowerCase()] !== undefined;
}

export function isDateExpression(s) {
    if (!s) return false;
    const str = s.trim().toLowerCase();

    // Keyword murni
    if (KEYWORDS[str]) return true;

    // Keyword + offset
    const match = str.match(/^(today|now|tomorrow|yesterday)\s*([+-])\s*(\d+)\s*([a-z]+)$/);
    if (match) return true;

    // Selisih dua tanggal (nanti)
    return false;
}

export function evaluateDate(s) {
    if (!s) return null;
    const str = s.trim().toLowerCase();

    if (KEYWORDS[str]) {
        return keywordToDate(KEYWORDS[str]);
    }

    // Keyword + offset
    const match = str.match(/^(today|now|tomorrow|yesterday)\s*([+-])\s*(\d+)\s*([a-z]+)$/);
    if (match) {
        const base = keywordToDate(KEYWORDS[match[1]]);
        if (!base) return null;

        const sign = match[2] === '+' ? 1 : -1;
        const amount = parseInt(match[3], 10);
        const unit = TIME_UNITS[match[4]];
        if (!unit) return null;

        return addTime(base, sign * amount, unit);
    }

    return null;
}

function keywordToDate(keyword) {
    const now = new Date();
    switch (keyword) {
        case 'today':
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        case 'now':
            return now;
        case 'tomorrow':
            return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        case 'yesterday':
            return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        default:
            return null;
    }
}

function addTime(date, amount, unit) {
    const d = new Date(date);
    switch (unit) {
        case 'days':
            d.setDate(d.getDate() + amount);
            break;
        case 'weeks':
            d.setDate(d.getDate() + amount * 7);
            break;
        case 'months':
            d.setMonth(d.getMonth() + amount);
            break;
        case 'years':
            d.setFullYear(d.getFullYear() + amount);
            break;
        case 'hours':
            d.setHours(d.getHours() + amount);
            break;
        case 'minutes':
            d.setMinutes(d.getMinutes() + amount);
            break;
        case 'seconds':
            d.setSeconds(d.getSeconds() + amount);
            break;
        default:
            return null;
    }
    return d;
}

/**
 * Format: "17 Oct 2026", "17 Oct 2026 03:15"
 */
export function formatDate(date, includeTime = false) {
    if (!(date instanceof Date)) return String(date);

    const options = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
    }

    return new Intl.DateTimeFormat('id-ID', options).format(date);
}

export function diffDays(dateA, dateB) {
    return Math.round((dateA - dateB) / DAY_MS);
}

export function isDate(value) {
    return value instanceof Date && !isNaN(value);
}

