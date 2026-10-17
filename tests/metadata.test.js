/* metadata.test.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { suite, test, eq } from './harness.js';
import { readLocale, writeLocale } from '../src/helpers/metadata.js';

suite('tests/metadata.test.js');

test('reads the locale from the leading blockquote', () => {
    eq(readLocale('a: 1'), null);
    eq(readLocale('> locale: en-US\n\na: 1'), 'en-US');
    eq(readLocale('> note: x\n> Locale: fr-FR\n'), 'fr-FR');
    eq(readLocale('# Title\n\n> locale: id-ID'), null);
});

test('writes by inserting into an existing blockquote', () => {
    eq(writeLocale('> note: x\n\na: 1', 'ja-JP'), '> locale: ja-JP\n> note: x\n\na: 1');
});

test('writes by replacing an existing locale line', () => {
    eq(writeLocale('> locale: en-US\n\na: 1', 'id-ID'), '> locale: id-ID\n\na: 1');
});

test('writes by creating a blockquote above content', () => {
    eq(writeLocale('a: 1', 'en-US'), '> locale: en-US\n\na: 1');
});
