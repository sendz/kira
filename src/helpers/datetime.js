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

import { locale } from './locale.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const KEYWORDS = {
    today: 'today',
    now: 'now',
    tomorrow: 'tomorrow',
    yesterday: 'yesterday',
};

// Whole-day offset each keyword represents when used as a duration, so
// "now + tomorrow" reads as "now + 1 day".
const KEYWORD_DAYS = {
    today: 0,
    now: 0,
    tomorrow: 1,
    yesterday: -1,
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

export function isTimeUnit(word) {
    if (!word) return false;
    return TIME_UNITS[word.trim().toLowerCase()] !== undefined;
}

export function isDateExpression(s, dates = {}) {
    return parseDateExpression(s, dates) !== null;
}

export function evaluateDate(s, dates = {}, values = {}, units = {}) {
    const parsed = parseDateExpression(s, dates);
    if (!parsed) return null;

    let date = baseDate(parsed.base, dates);
    if (!date) return null;

    for (const offset of parsed.offsets) {
        const term = resolveOffset(offset, values, units);
        if (!term) return null;

        date = addTime(date, offset.sign === '+' ? term.amount : -term.amount, term.unit);
        if (!date) return null;
    }

    return date;
}

// base : keyword | date variable        (dates)
// offset : ('+' | '-') (amount unit | duration)
//   amount   : number | numeric variable (values)
//   unit     : time unit                 (TIME_UNITS)
//   duration : date keyword | time-unit variable (values + units)
function parseDateExpression(s, dates) {
    const tokens = (s ?? '').trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0 || !baseDate(tokens[0], dates)) return null;

    const offsets = [];
    let i = 1;
    while (i < tokens.length) {
        const sign = tokens[i];
        if (sign !== '+' && sign !== '-') return null;

        const first = tokens[i + 1];
        if (first === undefined) return null;

        const unit = TIME_UNITS[(tokens[i + 2] ?? '').toLowerCase()];
        if (unit) {
            offsets.push({ sign, amount: first, unit });
            i += 3;
        } else {
            offsets.push({ sign, duration: first });
            i += 2;
        }
    }

    return { base: tokens[0], offsets };
}

function baseDate(token, dates) {
    const keyword = KEYWORDS[(token ?? '').toLowerCase()];
    if (keyword) return keywordToDate(keyword);

    return Object.prototype.hasOwnProperty.call(dates, token) ? dates[token] : null;
}

function resolveOffset({ amount, unit, duration }, values, units) {
    if (amount !== undefined) {
        const value = resolveAmount(amount, values);
        return value === null ? null : { amount: value, unit };
    }

    const keyword = KEYWORDS[(duration ?? '').toLowerCase()];
    if (keyword) {
        const days = KEYWORD_DAYS[keyword];
        return days === undefined ? null : { amount: days, unit: 'days' };
    }

    if (Object.prototype.hasOwnProperty.call(values, duration) && isTimeUnit(units[duration]))
        return { amount: values[duration], unit: TIME_UNITS[units[duration].toLowerCase()] };

    return null;
}

function resolveAmount(token, values) {
    if (/^-?\d+$/.test(token)) return parseInt(token, 10);
    return Object.prototype.hasOwnProperty.call(values, token) ? values[token] : null;
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

    return new Intl.DateTimeFormat(locale(), options).format(date);
}

export function diffDays(dateA, dateB) {
    return Math.round((dateA - dateB) / DAY_MS);
}

export function isDate(value) {
    return value instanceof Date && !isNaN(value);
}
