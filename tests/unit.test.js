/* unit.test.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { suite, test, eq, near, ok } from './harness.js';
import { convertUnit, isUnit } from '../src/helpers/unit.js';

suite('tests/unit.test.js');

test('isUnit recognises codes and aliases', () => {
    ok(isUnit('km'));
    ok(isUnit('kilometers'));
    ok(isUnit('C'));
    ok(!isUnit('xyz'));
    ok(!isUnit(''));
});

test('length conversions', () => {
    eq(convertUnit(1, 'km', 'm'), 1000);
    eq(convertUnit(1, 'm', 'cm'), 100);
    near(convertUnit(5, 'km', 'miles'), 3.1068559, 1e-6);
});

test('mass, volume and time', () => {
    near(convertUnit(2, 'kg', 'lbs'), 4.40924, 1e-4);
    near(convertUnit(1, 'gal', 'l'), 3.78541, 1e-6);
    eq(convertUnit(2, 'hours', 'minutes'), 120);
});

test('temperature', () => {
    eq(convertUnit(0, 'c', 'k'), 273.15);
    near(convertUnit(100, 'f', 'c'), 37.77777, 1e-4);
    near(convertUnit(100, 'c', 'f'), 212, 1e-9);
});

test('mismatched categories return null', () => {
    eq(convertUnit(1, 'km', 'kg'), null);
    eq(convertUnit(1, 'hour', 'm'), null);
});
