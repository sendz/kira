# Kira

![Kira Screensots](/screenshots/kira-screenshots-1.png)

Kira is a plain-text notebook. You write in it like a notepad, but any line 
that contains a calculation gets evaluated, and the result appears at the end 
of that line.

It's useful for shopping lists, trip budgets, quick sums, unit conversions, 
currency conversions, dates, or any everyday note that needs a bit of math.

## Features at a glance

- Markdown notes: headings, bold, italic, quotes, and lists.
- Inline calculator with variables.
- Unit conversion: length, weight, volume, time, and temperature.
- Currency conversion with daily exchange rates (no account or API key).
- Totals and statistics: sum, average, count, minimum, maximum.
- Dates: today, now, tomorrow, yesterday, and simple date math.
- Results are right-aligned, so columns of numbers stay tidy.
- Number and date formats follow your language.
- Plain text files (.txt, .md, .numi) with open, save, and save-as.

## Quick start

A calculation line is written as:

```
name: expression
```

Kira adds the answer after it, like `= 360`. You only type the part before
the `=`.

```
price: 120
quantity: 3
subtotal: price * quantity
```

Kira shows:

```
price: 120                  = 120
quantity: 3                 = 3
subtotal: price * quantity  = 360
```

Use a **colon** (`:`) between the name and the value. The `=` at the end is
added by Kira.

> The examples in this README use English number formatting (`12,000` and
> `3.5`). Kira actually follows your system language, so in Indonesian you
> would see `12.000` and `3,5`.

## Writing notes with Markdown

| You type | You get |
| --- | --- |
| `# Heading 1` … `###### Heading 6` | A heading |
| `**bold text**` | **Bold text** |
| `_italic text_` | _Italic text_ |
| `> quoted text` | A quote |
| `- item`, `* item`, or `+ item` | A list item |

Headings and quotes are not calculated, so you can use them freely. Normal
sentences without a colon are also left alone.

## Math and variables

- Use `+`, `-`, `*`, `/`, and parentheses.
- Give a name to any value, then use that name later.

```
price: 120
tax: price * 0.1
total_price: price + tax
```

Names can contain letters, numbers, and underscores, and must start with a
letter or an underscore. Kira also understands common number formatting, such
as `1,000` in English or `1.000` in Indonesian.

## Units

Put a unit after a number to attach it to that value. Kira remembers the unit,
even though the result itself is shown as a number.

```
distance: 5 km
distance_miles: distance to miles
```

To convert, write `to` (or `in`) and the unit you want:

```
miles: 5 km to miles
minutes: 2 hours in minutes
```

Some examples:

```
box: 500 ml
box_liters: box to liters

a: 1 km
b: 2 km
combined: a + b
combined_m: combined to m
```

Rules of thumb:

- You can add or subtract values that use the same unit.
- Inline units inside an expression (like `1 km + 500 m`) are not supported.
  Put each value on its own line first, then use the names.
- Mixing different units in one sum is not supported. Convert one of them
  first.

### Supported length units

| Unit | Also written as |
| --- | --- |
| `m` | `meter`, `meters` |
| `km` | `kilometer`, `kilometers` |
| `cm` | `centimeter`, `centimeters` |
| `mm` | `millimeter`, `millimeters` |
| `miles` | `mile`, `mi` |
| `ft` | `feet`, `foot` |
| `inch` | `inches`, `in` |
| `yard` | `yards`, `yd` |

### Supported weight (mass) units

| Unit | Also written as |
| --- | --- |
| `kg` | `kilogram`, `kilograms` |
| `g` | `gram`, `grams` |
| `mg` | `milligram`, `milligrams` |
| `lbs` | `lb`, `pound`, `pounds` |
| `oz` | `ounce`, `ounces` |
| `ton` | `tons`, `tonne` |

### Supported volume units

| Unit | Also written as |
| --- | --- |
| `l` | `liter`, `liters`, `litre`, `litres` |
| `ml` | `milliliter`, `milliliters` |
| `gal` | `gallon`, `gallons` |
| `cup` | `cups` |

### Supported time units

| Unit | Also written as |
| --- | --- |
| `s` | `sec`, `second`, `seconds` |
| `min` | `minute`, `minutes` |
| `hour` | `hours`, `h`, `hr` |
| `day` | `days` |

### Temperature

```
boiling: 100 c to f
body: 37 c to f
freezing: 32 f to c
zero: 0 c to k
```

| Unit | Also written as |
| --- | --- |
| `c` | `celsius` |
| `f` | `fahrenheit` |
| `k` | `kelvin` |

## Money and currencies

Put an ISO currency code after the amount. Kira shows the matching symbol.

```
price: 100 USD
fee: 20 USD
paid: price + fee
price_in_idr: price to IDR
```

```
price: 100 USD              = $100
fee: 20 USD                 = $20
paid: price + fee           = $120
price_in_idr: price to IDR  = Rp1.600.000
```

You can convert with `to` or `in`, and amounts in the same currency can be
added together. The symbol is shown automatically. The converted amount above
is only an example — the real number depends on the current exchange rate.

### Exchange rates

Kira uses daily reference rates from the European Central Bank, through the
free [Frankfurter](https://frankfurter.dev) service. No account or API key is
needed. Kira makes one request to:

```
https://api.frankfurter.dev/v1/latest?base=USD
```

The rates are relative to USD. Kira keeps the result in a small cache file in
the app's cache folder, so conversions still work offline, and it fetches
fresh rates about once a day. You can turn automatic updates off, check the
rate date, and refresh manually from **Preferences → Currency conversion**.

#### Currency conversion limitations

- **Only the currencies marked "Yes" below can be converted.** That is the
  European Central Bank's list of about 30 currencies. Other codes are still
  recognised as amounts and show their symbol, but they have no exchange rate.
- **These are daily reference rates, not live market rates.** They are not
  suitable for trading, accounting, or financial decisions, and they do not
  include bank fees, spreads, or taxes.
- **Rates are usually published on working days only.** On weekends and public
  holidays, the most recent available date is used.
- **No gold, silver, or special drawing rights.** `XAU`, `XAG`, and `XDR` are
  recognised as codes, but they have no rate.
- **An internet connection is needed for updates.** Without a connection Kira
  uses the last cached rates. If the app has never downloaded rates, currency
  conversion shows no result (everything else still works).
- **The rate date is shown in Preferences.** It is the ECB publication date,
  not necessarily the moment you last refreshed.
- **Conversions go through USD.** Kira normalises the table to USD and
  calculates `amount × rate(target) ÷ rate(source)`, so tiny rounding
  differences are normal.
- **The amount is rounded for display.** The calculation uses the full rate,
  but the result is formatted with your locale (usually up to two decimal
  places).
- **The service is third-party and free.** Availability and accuracy depend on
  Frankfurter and the European Central Bank.

The table below shows which currency codes have a live exchange rate.

### Supported currencies

| Code | Symbol | Live exchange rate |
| --- | --- | --- |
| `IDR` | Rp | Yes |
| `MYR` | RM | Yes |
| `SGD` | S$ | Yes |
| `THB` | ฿ | Yes |
| `PHP` | ₱ | Yes |
| `VND` | ₫ | No |
| `BND` | B$ | No |
| `KHR` | ៛ | No |
| `LAK` | ₭ | No |
| `MMK` | K | No |
| `CNY` | ¥ | Yes |
| `JPY` | ¥ | Yes |
| `KRW` | ₩ | Yes |
| `TWD` | NT$ | No |
| `HKD` | HK$ | Yes |
| `MOP` | MOP$ | No |
| `INR` | ₹ | Yes |
| `PKR` | ₨ | No |
| `BDT` | ৳ | No |
| `LKR` | Rs | No |
| `NPR` | Rs | No |
| `AFN` | ؋ | No |
| `KZT` | ₸ | No |
| `AED` | د.إ | No |
| `SAR` | ﷼ | No |
| `QAR` | ﷼ | No |
| `KWD` | د.ك | No |
| `BHD` | .د.ب | No |
| `OMR` | ﷼ | No |
| `JOD` | د.ا | No |
| `ILS` | ₪ | Yes |
| `TRY` | ₺ | Yes |
| `IRR` | ﷼ | No |
| `IQD` | ع.د | No |
| `EUR` | € | Yes |
| `GBP` | £ | Yes |
| `CHF` | CHF | Yes |
| `SEK` | kr | Yes |
| `NOK` | kr | Yes |
| `DKK` | kr | Yes |
| `PLN` | zł | Yes |
| `CZK` | Kč | Yes |
| `HUF` | Ft | Yes |
| `RON` | lei | Yes |
| `BGN` | лв | No |
| `HRK` | kn | No |
| `RSD` | дин | No |
| `RUB` | ₽ | No |
| `UAH` | ₴ | No |
| `ISK` | kr | Yes |
| `USD` | $ | Yes |
| `CAD` | C$ | Yes |
| `MXN` | MX$ | Yes |
| `BRL` | R$ | Yes |
| `ARS` | AR$ | No |
| `CLP` | CLP$ | No |
| `COP` | COL$ | No |
| `PEN` | S/ | No |
| `UYU` | $U | No |
| `ZAR` | R | Yes |
| `EGP` | E£ | No |
| `NGN` | ₦ | No |
| `KES` | KSh | No |
| `GHS` | ₵ | No |
| `MAD` | د.م. | No |
| `DZD` | د.ج | No |
| `TND` | د.ت | No |
| `ETB` | Br | No |
| `AUD` | A$ | Yes |
| `NZD` | NZ$ | Yes |
| `FJD` | FJ$ | No |
| `XAU` | XAU | No |
| `XAG` | XAG | No |
| `XDR` | XDR | No |

## Totals and statistics

A line that contains only one of these words works on the numbers above it:

| Keyword | What it does |
| --- | --- |
| `sum` or `total` | Adds the numbers |
| `avg`, `average`, or `mean` | Averages the numbers |
| `count` | Counts how many numbers there are |
| `min` | Shows the smallest number |
| `max` | Shows the largest number |

```
apples: 12000
oranges: 8000
milk: 15000
sum
average
count
min
max
```

```
apples: 12000    = 12,000
oranges: 8000    = 8,000
milk: 15000      = 15,000
sum              = 35,000
average          = 11,666.6667
count            = 3
min              = 8,000
max              = 15,000
```

How the sections work:

- Each keyword looks at the results since the **previous line with the same
  keyword** (or since the top of the note).
- The totals themselves are not counted again in later totals.
- This means you can make several small groups with `total` or `sum`:

```
a: 10
b: 20
sum        = 30
```

Later in the same note:

```
c: 5
sum        = 5
```

The second `sum` only adds what came after the first `sum`.

Every result above the keyword is used, including intermediate results. Keep
each group of numbers together, or use a different keyword for a new group.

If every value in a group uses the same currency, the total shows that
currency too (for example `$350`).

## Dates

You can use these words on their own:

| Word | Meaning |
| --- | --- |
| `today` | Today's date |
| `now` | Today's date and the current time |
| `tomorrow` | Tomorrow's date |
| `yesterday` | Yesterday's date |

You can add or subtract time with `+` and `-`:

```
start: today
due: start + 2 weeks
reminder: now + 3 hours
```

The supported date units are:

| Unit | Also written as |
| --- | --- |
| `day` | `days` |
| `week` | `weeks` |
| `month` | `months` |
| `year` | `years` |
| `hour` | `hours` |
| `minute` | `minutes` |
| `second` | `seconds` |

You can use numbers or variables as the amount:

```
days: 3
due: today + days days
```

Dates are shown in your language. When the result includes a time — for
example when you use `now`, hours, minutes, or seconds — Kira shows the time
as well.

A few useful notes:

- A date variable can be used in date math, but not in ordinary arithmetic.
- A date word used as a duration counts as a whole-day shift, so
  `now + tomorrow` means "now plus one day".
- Date math can be chained: `today + 1 week + 2 hours`.

## Language, numbers, and dates

Kira follows your system language by default. That affects number grouping,
decimal marks, and date names.

To change it, open **Preferences → Number format** and choose:

- **System default** to follow your computer,
- a preset such as `en-US` or `id-ID`, or
- **Custom…** to type any language tag.

You can also set it from a terminal (an empty value means "use the system
setting"):

```sh
gsettings set com.sendyyeah.Kira number-format-locale en-US
gsettings reset com.sendyyeah.Kira number-format-locale
```

### Per-note language

If one note needs a different language than the rest, put this blockquote at
the very top of the note:

```
> locale: id-ID
```

That note then uses that language while it is open. It does not change your
global default. The line is written back to the file when the note is saved,
but only when a language is explicitly set.

## Files

- **New**, **Open**, **Save**, and **Save As** are in the main menu.
- You can open `.txt`, `.md`, and `.numi` files (or any plain-text file).
- A bullet (`•`) in the window title means there are unsaved changes.
- If you close, start a new note, or open another file while there are unsaved
  changes, Kira asks whether to save, discard, or cancel.
- Notes are plain text, so you can open them in any editor. The calculated
  results are part of the text and are saved with the note.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+N` | New note |
| `Ctrl+O` | Open a note |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+Q` | Close the window |
| `Ctrl+,` | Preferences |

The usual text editing shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+Z`, and so on)
also work.

## Preferences

- **Number format** — choose how numbers and dates look.
- **Currency conversion** — turn automatic exchange rates on or off, see when
  the rates were last updated, and refresh them manually.

## Good to know

- A line needs a colon (`:`) to be calculated. A line with only a word such as
  `sum` is also calculated.
- Headings, quotes, and plain sentences are never calculated.
- Inline units and mixed units in one expression are not supported; use
  separate lines and variables.
- The date words (`today`, `now`, `tomorrow`, `yesterday`) and the statistics
  words (`sum`, `total`, `avg`, `average`, `mean`, `count`, `min`, `max`) are
  reserved. Avoid using them as variable names.
- A statistics word followed by a colon, such as `sum: a + b`, is treated as a
  normal calculation line.
- Currency conversion only works between the currencies marked "Yes" in the
  table above. Other currencies still show their symbol and can be used for
  same-currency math.

## Build and run

Kira is a Flatpak application built from this repository.

```sh
flatpak-builder --user --install --force-clean \
  --state-dir /tmp/kira-state /tmp/kira-build \
  com.sendyyeah.Kira.json

flatpak run com.sendyyeah.Kira
```

Run the tests with Meson:

```sh
meson setup _build
meson test -C _build
```

The project is licensed under GPL-3.0-or-later. See `COPYING`.
