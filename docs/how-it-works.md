---
title: How it works
description: The tracking model behind Focus Pulse — what counts as browsing time, how idle is handled, and the exact focus score formula.
---

# How it works

A score you can't interrogate isn't worth much. This page documents exactly what
Focus Pulse measures, what it deliberately refuses to measure, and how the
number on the gauge is calculated.

## What counts as browsing time

Time is credited to a site only when **all** of these hold:

- The site's tab is the active tab in its window.
- A Chrome window actually has focus.
- The system is not idle or locked.

The moment any of those stops being true, the clock stops and the elapsed time
is banked against that site's hostname. When they become true again, a fresh
session starts.

### Pages that are never tracked

Internal browser pages are skipped entirely — `chrome://`, `chrome-extension://`,
`edge://`, and `about:`. Time spent on the new tab page or in your settings is
not counted as browsing, and never appears in your statistics.

### Hostnames, not URLs

Only the hostname is stored. Reading three different articles on
`wikipedia.org` produces one entry, `wikipedia.org`, with the combined time. The
full address is used momentarily to extract that hostname and is not retained.

## Handling absence honestly

The hardest part of a focus tracker is not counting time you weren't there for.

**Idle detection runs on a 5-minute threshold.** Chrome's idle API only sees
physical keyboard and mouse input, so a shorter threshold punishes normal
behaviour — reading a long article without touching the mouse would register as
absence. Five minutes is the trade-off: genuine idle time takes up to five
minutes to be noticed, but ordinary reading is never misclassified.

**Audio is treated as presence.** If the active tab is playing audio when the
system goes idle, tracking continues. Watching a 40-minute talk is engagement,
not idling. A *locked* screen has no such exemption — if you locked the
computer, you left.

**Brief focus loss has a 300 ms grace period.** Opening DevTools or a zoom menu
can momentarily unfocus the window. Focus Pulse waits 300 ms and re-checks
before deciding the browser genuinely lost focus, so these blips don't shred a
session into fragments.

!!! info "Surviving Manifest V3"
    Chrome can kill an extension's service worker after roughly 30 seconds of
    inactivity, and in-memory variables die with it. Focus Pulse treats
    `chrome.storage.local` as the only source of truth, and runs a one-minute
    alarm that checkpoints the session in progress. Without that alarm, a long
    single-tab session — a video, a long read — would produce no events at all
    and the time would be silently lost.

## Short visits

A session shorter than **10 seconds** is recorded as a short visit and costs
score points. But this only applies when the session ended because you
*deliberately navigated away* — switched tabs or loaded a new URL.

A session cut short because the browser lost focus, went idle, or was
checkpointed by the alarm is **not** penalised. That is an interruption from
outside the browser, not you bouncing between sites, and scoring it as one would
punish you for taking a phone call.

## The focus score

Every day starts at 100 points and loses points for fragmentation:

```text
score = 100
      − (tab switches      × 1.5)
      − (short visits      × 3)
      − (10 if more than 15 distinct sites were visited)

clamped to the range 0–100, then rounded
```

### Grades and zones

The score maps to a letter grade and a focus zone. They use different
boundaries, on purpose — the zone is a coarse read for the gauge, the grade is
the finer judgement.

| Score | Grade | Zone |
| --- | --- | --- |
| 90–100 | **A** | Highly focused |
| 80–89 | **B** | Highly focused |
| 65–79 | **C** | Moderately focused |
| 50–64 | **D** | Moderately focused |
| 0–49 | **D** | Distracted |

### What the formula does not do

This is a v1 heuristic and it is worth being upfront about its limits. The
penalties are flat: a tab switch costs the same 1.5 points whether it happened
during an hour of deep work or during two minutes of triage. The formula does
not currently weight by time of day, by how long a session ran, or by what kind
of site was involved. Those are known future improvements, not oversights.

## Where the data lives

Each day is stored as a single small record in `chrome.storage.local`:

| Field | Contents |
| --- | --- |
| `sites` | Hostname → milliseconds of focused time |
| `switches` | Number of tab switches |
| `shortVisits` | Number of sessions under 10 seconds |
| `maxTabs` | Highest simultaneous tab count that day |

Alongside these sits the in-progress session state — the current hostname and
when its session started — which is cleared on every browser restart.

Because several listeners can fire at once (a tab switch, a tab close, and the
alarm landing together), all read-modify-write operations on that record are
serialised through a queue. Without it, two concurrent updates could silently
clobber each other and lose a chunk of your day.

Nothing here is transmitted anywhere. See [Privacy](privacy.md) for the full
statement.
