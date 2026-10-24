---
title: Seventy-three C++ implementations
description: Five weeks of data-structures drills — linked lists, STL, queues and the LeetCode problems that made them stick.
pubDate: 2024-10-30
category: university
stack: [C++, STL, Data Structures, Algorithms]
status: archived
order: 50
repoUrl: https://github.com/naimul3103/Data_structure
outcomes:
  - claim: Sustained practice across the whole course, not one heroic file.
    metric: "73 .cpp files over 5 weekly themes"
    method: "recursive file-tree count, grouped by week folder"
  - claim: Implemented the core structures by hand before using the STL equivalent.
    metric: "6 structures by hand: singly + doubly linked lists, 3 queue variants, stack-from-queues"
    method: "folder review: each structure has separate create/traverse/insert/delete files"
evidence:
  - https://github.com/naimul3103/Data_structure
whatIdDoDifferently: >-
  I would delete the compiled .out and .bin files, add a fifteen-line README that
  lists the weeks and topics, and move each week into its own folder with a
  single build command. Right now the work is real but almost impossible to
  navigate, which wastes the strongest thing about it: the volume.
---

## Why this is on the site

It is not a product. It is the paper trail of learning to think in pointers:
two weeks of linked lists, a week of STL `list` and cycle detection, then queues
built four different ways.

Reviewers rarely open a data-structures repo. When they do, they are checking
one thing — whether the fundamentals were actually practised. Seventy-three
files across five weeks is a decent answer.

## What is inside

| Week | Work                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 1    | STL vector, binary search, prefix sums, five assignment problems                       |
| 2    | Singly linked list: node creation, traversal, insert/delete at head, tail and position |
| 3    | Doubly linked list, cycle detection, mid-term set, four LeetCode list problems         |
| 4    | Queues on arrays and lists, queue-from-stacks, stack-from-queues, valid parentheses    |
| 5    | Course exercises                                                                       |

## The honest state of the repo

No README beyond the title, and compiled binaries committed alongside the
source. It is a working directory that happens to be public, not a curated
project. I am keeping it that way deliberately — it is evidence of practice,
and polishing it into a tutorial would make it less true.
