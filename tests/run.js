/* run.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import './unit.test.js';
import './aggregator.test.js';
import './metadata.test.js';
import './format.test.js';
import './currencies.test.js';
import './datetime.test.js';
import './rates.test.js';
import './calculator.test.js';

import { report } from './harness.js';

report();
