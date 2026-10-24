---
title: CryptoMaster — market dashboard with a virtual wallet
description: A university team project where I owned the PHP backend — 13 API actions, prepared statements everywhere, and a session model that survives review.
pubDate: 2026-04-13
category: university
stack: [PHP, MySQL, JavaScript, Binance API, HTML, CSS]
status: archived
order: 30
repoUrl: https://github.com/naimul3103/cryptomaster
outcomes:
  - claim: The public market view is driven by live Binance data, capped to the most liquid pairs.
    metric: "120 USDT pairs, sorted by 24h quote volume"
    method: "array_slice after usort on quoteVolume in application/api.php:154-163"
  - claim: Every database write goes through a prepared statement; no string-concatenated SQL remains.
    metric: "12 PDO prepared statements, 0 concatenated queries"
    method: "review of application/api.php against the PDO helper in db.php"
  - claim: Authentication uses bcrypt at cost 12, a constant-time dummy check against user enumeration, and session ID regeneration on login.
    metric: "3 separate mitigations, all in the login path"
    method: "manual audit of api.php:98-140; password_verify against a dummy hash before the real lookup"
evidence:
  - https://github.com/naimul3103/cryptomaster/blob/main/application/api.php
  - https://github.com/naimul3103/cryptomaster/blob/main/application/db.php
  - https://github.com/naimul3103/cryptomaster/blob/main/database/setup.sql
whatIdDoDifferently: >-
  I would split api.php into a router and controllers before adding a fourteenth
  action, add CSRF tokens to the state-changing endpoints, and write down the
  session policy in the README. The security work is solid for a course project,
  but a 260-line switch statement is not a foundation for a fifteenth endpoint.
---

## The problem

Three of us built a crypto dashboard for a university course: live market data,
candlestick charts, a virtual wallet with buy/sell and profit tracking, and an
admin view. I owned the backend and the database.

## What is actually implemented

The API is one PHP file with **13 actions** — register, login, logout, me,
market, candles, and the wallet/admin operations. That shape is not elegant, but
it is honest: every action is visible in one place, and the security review was
therefore possible in an afternoon.

**Live data.** `api.php` calls Binance's public `/ticker/24hr` and `/klines`
endpoints through a small cURL helper, filters to USDT pairs, sorts by 24-hour
quote volume and slices the top 120. The cap keeps the dashboard fast and the
list meaningful.

**Database.** PDO with `ATTR_EMULATE_PREPARES => false`, prepared statements for
every query, and a schema that initialises itself on first request. `.htaccess`
denies `.env`, `db.php`, `composer.lock` and the README; directory listing is
off; error display is off.

**Sessions.** `password_hash` with bcrypt cost 12, `session_regenerate_id(true)`
on login, and a deliberate `password_verify` against a dummy hash so a missing
user and a wrong password take the same time. Admin actions all pass through a
`requireAdmin()` guard.

## The parts I would not defend

- One controller file with a switch statement. It works; it does not scale.
- No CSRF token on state-changing requests, which is the first thing I would add.
- The team's contributor table still credits me as "Contributor Three" with a
  placeholder link. That is a one-line fix I keep meaning to make.

## Stack

PHP 8, MySQL, PDO, JavaScript, Binance public API, HTML/CSS.
