/* currencies.js
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

 * ISO 4217 to Currency Symbol mapping.
 * Ref: https://en.wikipedia.org/wiki/ISO_4217
 */

import { formatNumber } from './format.js';

const SUFFIX_SYMBOLS = ['kr', 'zł', 'Kč', 'Ft', 'lei', 'дин', 'лв'];

const CURRENCY_SYMBOLS = {
    // ASEAN
    IDR: 'Rp',
    MYR: 'RM',
    SGD: 'S$',
    THB: '฿',
    PHP: '₱',
    VND: '₫',
    BND: 'B$',
    KHR: '៛',
    LAK: '₭',
    MMK: 'K',

    // East Asia
    CNY: '¥',
    JPY: '¥',
    KRW: '₩',
    TWD: 'NT$',
    HKD: 'HK$',
    MOP: 'MOP$',

    // South and Central Asia
    INR: '₹',
    PKR: '₨',
    BDT: '৳',
    LKR: 'Rs',
    NPR: 'Rs',
    AFN: '؋',
    KZT: '₸',

    // Middle East
    AED: 'د.إ',
    SAR: '﷼',
    QAR: '﷼',
    KWD: 'د.ك',
    BHD: '.د.ب',
    OMR: '﷼',
    JOD: 'د.ا',
    ILS: '₪',
    TRY: '₺',
    IRR: '﷼',
    IQD: 'ع.د',

    // Europe
    EUR: '€',
    GBP: '£',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft',
    RON: 'lei',
    BGN: 'лв',
    HRK: 'kn',
    RSD: 'дин',
    RUB: '₽',
    UAH: '₴',
    ISK: 'kr',

    // America
    USD: '$',
    CAD: 'C$',
    MXN: 'MX$',
    BRL: 'R$',
    ARS: 'AR$',
    CLP: 'CLP$',
    COP: 'COL$',
    PEN: 'S/',
    UYU: '$U',

    // Afrika
    ZAR: 'R',
    EGP: 'E£',
    NGN: '₦',
    KES: 'KSh',
    GHS: '₵',
    MAD: 'د.م.',
    DZD: 'د.ج',
    TND: 'د.ت',
    ETB: 'Br',

    // Oceania
    AUD: 'A$',
    NZD: 'NZ$',
    FJD: 'FJ$',

    // Other
    XAU: 'XAU',   // Gold (troy ounce)
    XAG: 'XAG',   // Silver
    XDR: 'XDR',   // Special Drawing Rights
};

export function isCurrency(word) {
    if (!word) return false;
    return CURRENCY_SYMBOLS[word.toUpperCase()] !== undefined;
}

export function getSymbol(code) {
    if (!code) return '';
    return CURRENCY_SYMBOLS[code.toUpperCase()] || code.toUpperCase();
}

export function formatWithSymbol(value, code) {
    const symbol = getSymbol(code);
    const number = formatNumber(value, 2);

    return SUFFIX_SYMBOLS.includes(symbol) ? `${number} ${symbol}` : `${symbol}${number}`;
}
