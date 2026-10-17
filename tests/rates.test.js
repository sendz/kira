/* rates.test.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { suite, test, eq, near } from './harness.js';
import { convertWith, normalizeRates, convertCurrency, setRates } from '../src/helpers/rates.js';

suite('tests/rates.test.js');

const RATES = { USD: 1, IDR: 18031, EUR: 0.88865, JPY: 158.02 };

test('converts between two currencies', () => {
    near(convertWith(RATES, 100, 'USD', 'IDR'), 1803100, 1e-6);
    near(convertWith(RATES, 18031, 'IDR', 'USD'), 1, 1e-9);
    near(convertWith(RATES, 100, 'EUR', 'JPY'), 17782.03, 1e-2);
});

test('unknown currencies return null', () => {
    eq(convertWith(RATES, 1, 'USD', 'AED'), null);
});

test('normalizeRates pins a USD base', () => {
    const table = normalizeRates({ date: '2026-10-16', rates: { IDR: 18031 } });

    eq(table.base, 'USD');
    eq(table.date, '2026-10-16');
    eq(table.rates.USD, 1);
    eq(table.rates.IDR, 18031);
});

test('setRates makes convertCurrency deterministic', () => {
    setRates({ USD: 1, IDR: 18031 });

    near(convertCurrency(100, 'USD', 'IDR'), 1803100, 1e-6);
    eq(convertCurrency(1, 'USD', 'AED'), null);
});
