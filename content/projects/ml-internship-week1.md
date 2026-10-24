---
title: Week 1 of an applied-ML internship
description: Three investigations on a 30,000-row search dataset — including one result that contradicted the notebook I was given.
pubDate: 2026-09-21
category: open-source
stack: [Python, pandas, Jupyter, scikit-learn]
status: wip
order: 40
repoUrl: https://github.com/naimul3103/ml-internship
outcomes:
  - claim: Restricting the correlation to rows with real impressions did not rescue the relationship between search volume and impressions.
    metric: "r = 0.001, both with and without the filter"
    method: "pandas correlation on impressions_90d > 0 subset, executed in notebook cell 18"
  - claim: Average position and click-through rate barely move together in this dataset, contrary to the provided notebook's narrative.
    metric: "r = -0.073"
    method: "Pearson correlation over the full 30,000 rows, same notebook"
  - claim: The worst CTR sits with comparison articles in the top-3 tier, not with deep-page content.
    metric: "0.000 CTR, top_3 / comparison article"
    method: "groupby(content_type × position_tier).ctr.min()"
whatIdDoDifferently: >-
  I would write the research question before touching a notebook, and I would
  keep my own analysis in work/ instead of editing the supplied notebook. The
  finding is stronger than the file layout suggests, and right now a reviewer
  has to dig through a template to find it.
---

## The context

This repository is a starter template for an eight-week applied-ML internship.
The template ships a 30,000-row anonymised search dataset and a notebook that
walks through a first look at it. Week 1 asked for three investigations.

I want to be precise about what is mine here, because it is easy to overclaim:
the pipeline, the dataset and most of the notebook are the template's. My work
is three analyses in the discovery notebook, plus the notes below. The 0.74
precision@50 figure in the template's README is the starter pipeline's benchmark,
not a model I trained.

## What I found

**1. Search volume does not explain impressions here.** The supplied notebook
suggests a relationship. Restricting to rows with `impressions_90d > 0` — the
only rows where the question is meaningful — gives a correlation of **0.001**.
That is not a weak relationship; it is no relationship.

**2. Position and CTR are almost independent.** The template repeats the usual
"CTR cliff by position" story. In this data the correlation between
`avg_position` and `ctr` is **−0.073**. Weak enough that I would not build a
recommendation on it.

**3. The worst CTR is not where the story says.** Grouping by content type
within position tier, the minimum CTR is **0.000** for comparison articles in
the top-3 tier, versus 0.141 for page-1 comparison articles. If I were running
the content team, that is the first bucket I would inspect.

## Why this is the useful result

A junior analyst is often rewarded for confirming the brief. The more valuable
move was to check whether the brief's claim survived contact with the data, and
then to say so plainly. That is the habit I want to carry into a team.

## What is still missing

Week 1 of 8. The research-question write-up in `work/` is still a skeleton, and
the capstone does not exist yet. Status is `wip` because it is.
