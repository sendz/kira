/* format.test.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { suite, test, eq } from './harness.js';
import { normalizeNumbers, formatNumber } from '../src/helpers/format.js';
import { setLocaleOverride } from '../src/helpers/locale.js';

suite('tests/format.test.js');

test('parses Indonesian number notation', () => {
    setLocaleOverride('id-ID');

    eq(normalizeNumbers('75.000'), '75000');
    eq(normalizeNumbers('1.234,56'), '1234.56');
    eq(normalizeNumbers('1,5'), '1.5');
    eq(normalizeNumbers('1.5'), '1.5');
    eq(formatNumber(1234567.89), '1.234.567,89');
});

test('parses US number notation', () => {
    setLocaleOverride('en-US');

    eq(normalizeNumbers('75,000'), '75000');
    eq(normalizeNumbers('1,000.5'), '1000.5');
    eq(normalizeNumbers('1.5'), '1.5');
    eq(formatNumber(1234567.89), '1,234,567.89');

    setLocaleOverride('');
});
