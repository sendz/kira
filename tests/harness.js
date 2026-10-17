/* harness.js
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

import GLib from 'gi://GLib';
import system from 'system';

const color = !GLib.getenv('NO_COLOR') && GLib.getenv('TERM') !== 'dumb';
const paint = (code, text) => color ? `\x1b[${code}m${text}\x1b[0m` : text;
const green = text => paint(32, text);
const red = text => paint(31, text);
const dim = text => paint(2, text);
const bold = text => paint(1, text);

const suites = [];
const startedAt = Date.now();
let current = null;

export function suite(name) {
    flush();
    current = { name, tests: [] };
}

export function test(name, fn) {
    if (!current)
        suite('tests');

    const started = Date.now();
    let error = null;

    try {
        fn();
    } catch (e) {
        error = e.message ?? String(e);
    }

    current.tests.push({ name, error, ms: Date.now() - started });
}

export function eq(actual, expected, message = '') {
    if (!Object.is(actual, expected))
        fail(withMessage(message, `expected ${show(expected)}, got ${show(actual)}`));
}

export function near(actual, expected, epsilon = 1e-9, message = '') {
    if (!(Math.abs(actual - expected) <= epsilon))
        fail(withMessage(message, `expected ~${expected}, got ${actual}`));
}

export function ok(value, message = '') {
    if (!value)
        fail(message || `expected truthy, got ${show(value)}`);
}

export function report() {
    flush();

    const tests = suites.flatMap(suite => suite.tests);
    const failed = tests.filter(t => t.error !== null).length;
    const suitesFailed = suites.filter(suite => suite.tests.some(t => t.error !== null)).length;

    const suiteParts = [];
    if (suitesFailed)
        suiteParts.push(red(`${suitesFailed} failed`));
    suiteParts.push(green(`${suites.length - suitesFailed} passed`), `${suites.length} total`);
    print(`${bold('Test Suites:')} ${suiteParts.join(', ')}`);

    const testParts = [];
    if (failed)
        testParts.push(red(`${failed} failed`));
    testParts.push(green(`${tests.length - failed} passed`), `${tests.length} total`);
    print(`${bold('Tests:')}       ${testParts.join(', ')}`);

    print(`${bold('Time:')}        ${((Date.now() - startedAt) / 1000).toFixed(2)} s`);

    if (failed)
        system.exit(1);
}

function flush() {
    if (!current || current.tests.length === 0) {
        current = null;
        return;
    }

    const suiteFailed = current.tests.some(t => t.error !== null);
    print(`${suiteFailed ? red('FAIL') : green('PASS')} ${current.name}`);

    for (const { name, error, ms } of current.tests) {
        print(`  ${error ? red('✗') : green('✓')} ${name} ${dim(`(${ms} ms)`)}`);

        if (error)
            print(`      ${red(error)}`);
    }

    print('');
    suites.push(current);
    current = null;
}

function fail(message) {
    throw new Error(message);
}

function withMessage(message, text) {
    return message ? `${message} ${text}` : text;
}

function show(value) {
    return typeof value === 'string' ? JSON.stringify(value) : String(value);
}
