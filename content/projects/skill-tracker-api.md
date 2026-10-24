---
title: Developer Skill Tracker API
description: A layered FastAPI service for skills and learning journals — built to practise referential integrity and honest API documentation.
pubDate: 2026-10-18
category: personal
stack: [Python, FastAPI, Pydantic v2, Uvicorn, REST]
status: wip
order: 20
repoUrl: https://github.com/naimul3103/skill-tracker-api
outcomes:
  - claim: A complete CRUD surface for both resources, documented in Swagger and ReDoc.
    metric: "12 routes across 2 resources + health"
    method: "route audit of main.py, routers/skills.py and routers/journals.py"
  - claim: Deleting a skill that still has journal entries is refused at the boundary instead of silently orphaning rows.
    metric: "400 on 100% of blocked deletes"
    method: "code path at routers/skills.py:107-115 scans JOURNALS_DB before deletion; manual request check"
evidence:
  - https://github.com/naimul3103/skill-tracker-api/blob/main/routers/skills.py
  - https://github.com/naimul3103/skill-tracker-api/blob/main/README.md
whatIdDoDifferently: >-
  The mock dictionary store was a shortcut that undermines the README's
  "production-style" claim — data disappears on restart. I would replace it with
  SQLite plus SQLAlchemy, add pytest coverage for the 422 and 400 paths, and
  remove the word production until a database and a test suite exist.
---

## The problem

Most of my earlier work was single-file scripts. I wanted a project where the
structure itself was the deliverable: routers, schemas and a data layer that do
not import each other in a circle, and validation that fails loudly at the edge.

## The design decisions

**One shared data layer.** `db.py` owns both stores. Routers never define their
own dictionaries, which removes the circular-import trap and lets the journals
router validate a `skill_id` against the skills store.

**Partial updates done properly.** `PUT` uses Pydantic's
`model_dump(exclude_unset=True)`. If a client sends only `{"rating": 9}`, the
name and category are not overwritten with `None` — a bug that is easy to write
and hard to notice.

**Referential integrity without a database.** Before a skill is deleted, the
handler scans the journal store and returns `400` if anything references it.
This is the behaviour a foreign key with `ON DELETE RESTRICT` would give;
implementing it by hand made the constraint legible.

## What is real, and what is not

Real: 12 routes, Pydantic v2 validation with examples, OpenAPI docs at `/docs`
and `/redoc`, the delete guard, and a pinned dependency set.

Not real: persistence. `db.py` is an explicitly labelled mock, and every restart
returns an empty API. There is no auth, no test suite and no container.

I would rather write that paragraph than have a reviewer discover it.

## Stack

Python 3.10+, FastAPI 0.146, Pydantic 2.14, Uvicorn 0.54.
