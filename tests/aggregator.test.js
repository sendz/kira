/* aggregator.test.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { suite, test, eq, near, ok } from './harness.js';
import { isAggregateKeyword, computeAggregate } from '../src/helpers/aggregator.js';

suite('tests/aggregator.test.js');

test('keywords and aliases', () => {
    for (const word of ['sum', 'total', 'avg', 'average', 'mean', 'count', 'min', 'max', 'SUM', 'Avg'])
        ok(isAggregateKeyword(word), word);

    ok(!isAggregateKeyword('median'));
    ok(!isAggregateKeyword(''));
});

test('aggregate operations', () => {
    const scope = { a: 5, b: 3, c: 10 };

    eq(computeAggregate('sum', scope), 18);
    eq(computeAggregate('total', scope), 18);
    near(computeAggregate('avg', scope), 6);
    eq(computeAggregate('count', scope), 3);
    eq(computeAggregate('min', scope), 3);
    eq(computeAggregate('max', scope), 10);
});

test('empty and non-numeric values', () => {
    eq(computeAggregate('sum', {}), null);
    eq(computeAggregate('sum', { a: 'x', b: NaN }), null);
    eq(computeAggregate('sum', { a: 1, b: 'x', c: 2 }), 3);
});
