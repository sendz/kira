/* datetime.test.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { suite, test, eq, ok } from './harness.js';
import {
    isDateKeyword,
    isTimeUnit,
    isDateExpression,
    evaluateDate,
    formatDate,
    diffDays,
    isDate,
} from '../src/helpers/datetime.js';
import { setLocaleOverride } from '../src/helpers/locale.js';

suite('tests/datetime.test.js');

const DAY = 24 * 60 * 60 * 1000;

function scope() {
    return { dates: {}, values: {}, units: {} };
}

test('detects keywords, units and expressions', () => {
    ok(isDateKeyword('today'));
    ok(isDateKeyword('NOW'));
    ok(!isDateKeyword('later'));

    ok(isTimeUnit('days'));
    ok(!isTimeUnit('km'));

    ok(isDateExpression('today'));
    ok(isDateExpression('today + 3 days'));
    ok(isDateExpression('start + delay', { start: new Date() }));
    ok(!isDateExpression('1 + 2'));
});

test('relative keyword offsets', () => {
    const s = scope();
    const today = evaluateDate('today', s);

    eq(evaluateDate('tomorrow', s) - today, DAY);
    eq(evaluateDate('yesterday', s) - today, -DAY);
    eq(evaluateDate('today + 3 days', s) - today, 3 * DAY);
    eq(evaluateDate('today + 2 weeks', s) - today, 14 * DAY);
});

test('variable bases, amounts and durations', () => {
    const s = scope();
    s.dates.start = new Date(2026, 9, 17);
    s.values.n = 3;
    s.values.delay = 2;
    s.units.delay = 'hours';

    const evalIn = expression => evaluateDate(expression, s.dates, s.values, s.units);

    eq(evalIn('start').getTime(), new Date(2026, 9, 17).getTime());
    eq(evalIn('start + 3 days').getTime(), new Date(2026, 9, 20).getTime());
    eq(evalIn('start + n days').getTime(), new Date(2026, 9, 20).getTime());
    eq(evalIn('start + delay').getTime(), new Date(2026, 9, 17, 2).getTime());
});

test('a keyword used as a duration shifts by whole days', () => {
    const s = scope();
    const today = evaluateDate('today', s);

    eq(evaluateDate('today + tomorrow', s) - today, DAY);
    eq(evaluateDate('today + yesterday', s) - today, -DAY);
});

test('invalid expressions return null', () => {
    eq(evaluateDate('1 + 2', scope()), null);
    eq(evaluateDate('today + xyz days', scope()), null);
});

test('formats dates per locale', () => {
    setLocaleOverride('en-US');
    eq(formatDate(new Date(2026, 9, 17)), 'Oct 17, 2026');

    setLocaleOverride('id-ID');
    eq(formatDate(new Date(2026, 9, 17)), '17 Okt 2026');

    setLocaleOverride('');
});

test('diffDays and isDate', () => {
    eq(diffDays(new Date(2026, 9, 20), new Date(2026, 9, 17)), 3);
    ok(isDate(new Date()));
    ok(!isDate(new Date('nope')));
    ok(!isDate(5));
});
