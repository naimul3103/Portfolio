---
title: A contrast gate is cheaper than a design review
description: The accent I liked failed WCAG by 0.18. A 60-line script caught it before a reviewer did.
pubDate: 2026-10-24
status: evergreen
tags: [accessibility, design-systems, ci]
---

I picked an electric indigo because it looked right against a near-black
background. On the page background it measured 4.58:1 — a pass. On the elevated
card surface it measured 4.32:1 — a fail, invisible to my eye and obvious to a
contrast checker.

The fix was one hex value. The lesson was not about the hex.

Design review catches this eventually, usually after the palette has been
copied into twelve components. A script catches it in the second commit, for
every colour pair, on every future theme edit — including the ones made by a
future me who has forgotten the rule.
