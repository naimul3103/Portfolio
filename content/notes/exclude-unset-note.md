---
title: exclude_unset, and the field that vanished
description: A PUT handler that overwrote every field the client did not send. One argument fixes it; the test is what keeps it fixed.
pubDate: 2026-10-20
status: growing
tags: [fastapi, pydantic, api-design]
---

Pydantic v2's `model_dump(exclude_unset=True)` distinguishes "the client sent
`null`" from "the client did not mention this field". A partial update needs the
second meaning:

```python
updates = payload.model_dump(exclude_unset=True)
stored.update(updates)
```

Without it, `PUT /skills/1 {"rating": 9}` sets `name` to `None` and the record
loses its identity. The bug is quiet because the response is a 200.

The missing half is a test that sends one field and asserts the rest survived.
I have the handler; I do not have the test yet.
