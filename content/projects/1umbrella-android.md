---
title: 1umbrella — Android service booking
description: A five-person university Android project. I contributed the scaffolding, Firebase wiring and a credential-rotation fix — three of seventeen commits.
pubDate: 2025-12-15
category: university
stack: [Java, Android, Firebase Auth, Firestore, Gradle]
status: archived
order: 60
repoUrl: https://github.com/naimul3103/1_umbrella
outcomes:
  - claim: A working multi-screen booking flow built by a team of five for a mobile-application lab.
    metric: "12 Java classes, 8 layouts, 5 screens"
    method: "source-tree review of app/src/main/java and res/layout"
  - claim: My contribution was infrastructure, not the whole app.
    metric: "3 of 17 commits"
    method: "git log authorship count via the GitHub API"
evidence:
  - https://github.com/naimul3103/1_umbrella
whatIdDoDifferently: >-
  I would keep google-services.json out of the repository from the first commit,
  restrict the API key by package and signing certificate in the Firebase
  console, and add a README section that states each member's contribution. The
  key incident cost us an afternoon that nobody remembers fondly.
---

## The project

An on-demand home-services app: browse providers, open a provider profile, book a
slot, and see your bookings. Built for CSE414 Mobile Application Design Lab at
Daffodil International University by a team of five, with Firebase handling auth
and data.

## What I actually did

I set up the Android project structure and Gradle configuration, wired Firebase
Authentication and Firestore into the screens the team built, and handled a
committed-credential incident — revoking the exposed key and getting the build
green again.

Three commits out of seventeen. The rest belongs to my teammates, and the README
should say so; right now it lists the team but not the split.

## What the code shows

Twelve Java classes across login, registration, provider list, provider detail,
booking, my-bookings and profile, with matching layouts and three screenshots.
No released APK, so this is coursework rather than a shipped product.

## What I learned

The interesting lesson was not Android. It was that a shared repository needs
rules about secrets before the first commit, not after the first incident.
