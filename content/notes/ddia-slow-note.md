---
title: Reading DDIA slowly on purpose
description: Two chapters in, and the useful part is not the systems — it is the vocabulary for trade-offs.
pubDate: 2026-10-06
status: seedling
tags: [reading, systems]
---

I am reading _Designing Data-Intensive Applications_ at roughly ten pages a day,
which is slower than I read anything else. The reason is that almost every
paragraph contains a trade-off I have made badly in a small project without
having a name for it.

Replication lag, read-your-writes, monotonic reads: these are not distributed
systems trivia. They are the questions you should ask before putting a cache in
front of an API that a user just wrote to.

A book that gives you names for your own mistakes is worth the slow pace.
