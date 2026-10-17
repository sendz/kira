/* currencies.test.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { suite, test, eq, ok } from './harness.js';
import { isCurrency, getSymbol, formatWithSymbol } from '../src/helpers/currencies.js';
import { setLocaleOverride } from '../src/helpers/locale.js';

suite('tests/currencies.test.js');

test('detects currency codes case-insensitively', () => {
    ok(isCurrency('usd'));
    ok(isCurrency('IDR'));
    ok(!isCurrency('XYZ'));
});

test('maps codes to symbols', () => {
    eq(getSymbol('usd'), '$');
    eq(getSymbol('idr'), 'Rp');
    eq(getSymbol('sek'), 'kr');
    eq(getSymbol('unknown'), 'UNKNOWN');
});

test('formats prefix and suffix symbols', () => {
    setLocaleOverride('en-US');

    eq(formatWithSymbol(1234.5, 'USD'), '$1,234.5');
    eq(formatWithSymbol(100, 'SEK'), '100 kr');

    setLocaleOverride('');
});
