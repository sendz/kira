/* calculator.test.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Gtk from 'gi://Gtk?version=4.0';

import { suite, test, eq, ok } from './harness.js';
import { setupMarkdownTags, applyMarkdown, setResultTabStop } from '../src/helpers/markdown.js';
import { clearResults, insertResults, evaluate } from '../src/helpers/calculator.js';
import { setLocaleOverride } from '../src/helpers/locale.js';
import { setRates } from '../src/helpers/rates.js';

suite('tests/calculator.test.js');

function render(source) {
    const buffer = new Gtk.TextBuffer();
    setupMarkdownTags(buffer);
    setResultTabStop(buffer, 768);

    const results = [];
    buffer.set_text(source, -1);
    applyMarkdown(buffer);
    insertResults(buffer, results);

    const first = buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), true);

    clearResults(buffer, results);
    applyMarkdown(buffer);
    insertResults(buffer, results);

    const second = buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), true);

    if (first !== second)
        throw new Error(`not idempotent:\n${first}\n---\n${second}`);

    return first;
}

test('assignments, aggregates and totals', () => {
    setLocaleOverride('id-ID');

    eq(render('a: 5\nb: 3\nsum'), 'a: 5\t= 5\nb: 3\t= 3\nsum\t= 8');
    eq(render('a: 5\nb: 3\navg\ncount\nmin\nmax'), 'a: 5\t= 5\nb: 3\t= 3\navg\t= 4\ncount\t= 2\nmin\t= 3\nmax\t= 5');

    setLocaleOverride('');
});

test('units and remembered units', () => {
    setLocaleOverride('id-ID');

    eq(render('d: 10 km\nm: d to miles'), 'd: 10 km\t= 10\nm: d to miles\t= 6,2137');
    eq(render('A: 1 km to cm\nB: 1 m to cm\nD: A + B to m'),
       'A: 1 km to cm\t= 100.000\nB: 1 m to cm\t= 100\nD: A + B to m\t= 1.001');

    setLocaleOverride('');
});

test('currency propagation and symbols', () => {
    setLocaleOverride('id-ID');

    eq(render('a: 100 USD\nb: 50 USD\ntotal: a + b'),
       'a: 100 USD\t= $100\nb: 50 USD\t= $50\ntotal: a + b\t= $150');

    setLocaleOverride('');
});

test('converts across currencies with a rate table', () => {
    setLocaleOverride('id-ID');
    setRates({ USD: 1, IDR: 18031 });

    eq(render('usd: 100 USD\nidr: usd to IDR'),
       'usd: 100 USD\t= $100\nidr: usd to IDR\t= Rp1.803.100');

    setLocaleOverride('');
});

test('renders dates and skips metadata lines', () => {
    setLocaleOverride('en-US');

    ok(/^> locale: en-US\n\na: 5\t= 5$/.test(render('> locale: en-US\n\na: 5')));
    ok(/^d: today\t= [A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(render('d: today')));

    setLocaleOverride('');
});

test('evaluate handles plain expressions', () => {
    eq(evaluate('1 + 2', {}), 3);
    eq(evaluate('a * 2', { a: 5 }), 10);
    eq(evaluate('missing + 1', {}), null);
});
