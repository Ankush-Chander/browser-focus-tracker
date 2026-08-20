---
title: Privacy Policy
description: Focus Pulse's privacy policy. Everything it measures stays on your device — no servers, no accounts, no third parties.
---

# Privacy Policy

**Focus Pulse &middot; Chrome Extension**
Effective 20 August 2026 &middot; Applies to version 1.0

Focus Pulse measures how you spend your own browsing time and shows it back to
you. Every measurement it takes is stored on your computer, in your browser, and
stays there. There is no server to send it to.

<div class="ft-facts" markdown>
<div class="ft-fact"><b>0</b><span>network requests made by the extension</span></div>
<div class="ft-fact"><b>0</b><span>third parties with access to your data</span></div>
<div class="ft-fact"><b>No</b><span>account, login, or cloud sync</span></div>
<div class="ft-fact"><b>Local</b><span>storage only, erased when you uninstall</span></div>
</div>

## The short version

- Focus Pulse records which website domain is in your active tab and for how
  long, so it can show you a daily focus score.
- That information is written to your browser's local extension storage. It is
  never uploaded, transmitted, shared, or sold.
- The extension contains no analytics, no tracking pixels, no advertising, and
  no code loaded from the internet.
- Your data leaves your device only when you click an export button, and then it
  goes straight to your own Downloads folder.
- Uninstalling the extension deletes everything it stored.

## What Focus Pulse stores on your device

For each calendar day, the extension keeps a small record in
`chrome.storage.local`:

**Site hostnames and time totals**
: For example `wikipedia.org` paired with the number of milliseconds it was the
  focused tab. Only the hostname is kept, never the full address of the page.

**Tab switches**
: A count of how many times you changed active tabs.

**Short visits**
: A count of sessions that ended almost as soon as they started.

**Maximum open tabs**
: The highest number of tabs open at once that day.

**Current session state**
: The hostname you are on right now and when that session began, so a session
  survives Chrome suspending the extension. This is cleared each time the
  browser restarts.

These daily records accumulate locally to build the 7-day trend shown on the
dashboard. Nothing else is recorded.

## What it never touches

- The content of any page you visit. Focus Pulse injects no scripts into
  websites and cannot read them.
- Full URLs, search queries, page titles, or paths. The address of the active
  tab is read only to extract the hostname, and is not retained.
- Anything you type — keystrokes, form fields, passwords, messages.
- Your name, email address, IP address, or any account identifier. The extension
  has no concept of who you are.
- Your location, contacts, files, or download history.
- Browser pages such as `chrome://`, `edge://`, `about:`, and extension pages,
  which are skipped entirely.

## Why each permission is requested

Focus Pulse asks for the smallest set of permissions that lets it measure
attention. Every one of them is used entirely on your machine.

| Permission | What it is used for | Leaves device? |
| --- | --- | --- |
| `tabs` | Read the active tab's address to derive its hostname, count tab switches and open tabs, and detect whether a tab is playing audio so video time is not mistaken for idle time. | <span class="ft-chip">No</span> |
| `storage` | Save your statistics and in-progress session on your own device. Local storage only — never Chrome's account sync. | <span class="ft-chip">No</span> |
| `idle` | Notice when you step away or lock the screen, so time away from the computer is not counted as browsing. Only the coarse active / idle / locked state is read. | <span class="ft-chip">No</span> |
| `alarms` | Wake the extension once a minute to save the session in progress, so long stretches on one page are not lost when Chrome suspends it. | <span class="ft-chip">No</span> |
| `downloads` | Save the JSON, CSV, or weekly report file to your Downloads folder when you click an export button. The extension never downloads anything from the internet and does not read your existing downloads. | <span class="ft-chip">Only if you export</span> |

## No remote code

Everything Focus Pulse runs is included in the package you install from the
Chrome Web Store. It loads no remote scripts, uses no `eval()` or dynamically
constructed code, fetches no modules or WebAssembly at runtime, and contacts no
server — because it does not have one.

## Sharing, selling, and analytics

Focus Pulse does not sell or transfer your data to third parties. It does not
use your data for advertising, credit or lending decisions, or any purpose
unrelated to showing you your own focus statistics. There are no analytics or
crash-reporting services embedded in it. Since nothing is transmitted, there is
nothing to share.

## How long data is kept, and how to remove it

Daily records stay in your browser's local storage until you remove them. You
are always in control:

**Reset today**
: The button in the extension popup deletes the current day's record
  immediately.

**Clear everything**
: Removing Focus Pulse from `chrome://extensions` deletes all of its stored
  data along with it. Nothing survives elsewhere, because there is nowhere else.

**Take it with you**
: Export your statistics as JSON or CSV at any time. The files are yours; the
  extension keeps no copy of what you exported.

## Incognito windows

Chrome does not run extensions in Incognito windows unless you explicitly allow
it. Left at the default, Focus Pulse records nothing while you browse in
Incognito.

## Children

Focus Pulse is not directed at children and collects no personal information
from anyone, regardless of age.

## Changes to this policy

If a future version of Focus Pulse changes what it measures or stores, this
page will be updated and the effective date at the top revised before that
version is published. A change that introduced any transmission of your data off
your device would be stated here plainly.

## Contact

Questions about this policy, or about the extension's handling of data, can be
sent to <span class="ft-placeholder">your-contact-email@example.com</span>.

!!! warning "Placeholder — replace before publishing"
    The contact address above is a placeholder. Replace it in
    `docs/privacy.md` with the same address you verify as the publisher
    contact in the Chrome Web Store Developer Dashboard, then redeploy.
    This admonition can be deleted at the same time.
