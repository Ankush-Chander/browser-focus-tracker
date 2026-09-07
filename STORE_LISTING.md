# Chrome Web Store — Privacy Practices Submission

> **Status: published.** Focus Pulse is live at
> <https://chromewebstore.google.com/detail/focuspulse/gcffkhpmcpjkmjmjeeiigbnjieoaennn>.
> The blockers listed at the bottom of this file were resolved before
> submission. Keep this document as the reference for the answers on file —
> reuse it when editing the listing or submitting a new version.

Copy each block into the matching field on the **Privacy practices** tab of the
item edit page. Text is written to fit the store's field limits and reviewer
expectations (state the feature, then the permission's role in it).

---

## Single purpose description

Focus Pulse has one purpose: to measure the user's own browsing focus and show
it back to them as local productivity statistics. It records how long the active
tab's site is in the foreground, how often the user switches tabs, and when the
browser is idle, then turns those measurements into a daily focus score, session
history, and a 7-day trend shown in the extension popup and dashboard. All data
stays in local storage on the user's device; the extension has no backend, no
account, and makes no network requests.

---

## Permission: `tabs`

Focus Pulse's core feature is measuring how long the user spends on each site
and how often they switch tabs. The `tabs` permission is what lets the extension
read the URL of the currently active tab so it can derive the hostname that time
is attributed to, and count open tabs and tab switches.

Specifically it is used to:

- Read the active tab's URL on `tabs.onActivated` and `tabs.onUpdated` so the
  hostname (e.g. `example.com`) can be extracted and time attributed to it.
- Count currently open tabs via `tabs.query({})` on `onCreated`, `onRemoved`,
  `onAttached`, and `onDetached` to report the day's maximum simultaneous tabs.
- Check whether the active tab is playing audio (`tab.audible`) so that watching
  a video is not misread as idle time.
- Open the extension's own dashboard page via `tabs.create`.

Only the hostname is ever persisted. Full URLs are used transiently to compute
the hostname and are cleared on browser startup. No page content is read, and
the extension injects no scripts into pages. Without `tabs`, the extension
cannot tell which site the user is on and has no product at all.

---

## Permission: `storage`

Focus Pulse is local-first and has no server, so `chrome.storage.local` is the
only place the user's statistics can live. It is used to persist the day's
tracked hostnames and time totals, tab-switch and short-visit counts, maximum
open tabs, session start/longest-session data, and the rolling 7-day history
that the popup and dashboard render.

It is also used to hold the small amount of in-flight tracking state (the
currently active hostname and session start timestamp) so that a session is not
lost when Chrome suspends the Manifest V3 service worker, and to notify the
popup of live updates through `storage.onChanged`.

Only local storage is used — never `storage.sync` — so nothing is uploaded to a
Google account or any other server.

---

## Permission: `alarms`

Under Manifest V3 the background service worker is suspended after a short
period of inactivity, and `setInterval` does not survive that suspension.
Focus Pulse uses a single `chrome.alarms` alarm firing once per minute to wake
the service worker and checkpoint the current session's elapsed time to local
storage.

This matters during long single-tab sessions — for example watching a video or
reading a long article — where no tab event fires for many minutes. Without the
alarm, the worker would be suspended and that time would be silently lost from
the user's statistics. The alarm performs a save only; it makes no network
requests and shows no notifications.

---

## Permission: `idle`

A focus tracker must not credit the user with time they were not actually at the
computer. Focus Pulse uses `chrome.idle` to detect when the user stops
interacting with the machine so it can stop the timer and close the session,
then resume when they return.

It is used to:

- Set a 5-minute detection interval via `idle.setDetectionInterval(300)`.
- Listen to `idle.onStateChanged` to end the active session when the state
  becomes `idle` or `locked`, and resume tracking on `active`.
- Call `idle.queryState()` when a tab finishes loading, so the extension can
  distinguish a real return-to-browser from background page activity.

Only the coarse idle/active/locked state is read. No input, keystrokes, or
content are captured. Without `idle`, overnight and away-from-desk periods would
be counted as browsing time and every focus score would be wrong.

---

## Permission: `downloads`

Focus Pulse lets the user export their own statistics so their data is not
locked inside the extension: browsing statistics as JSON, per-site time as CSV,
and a plain-text weekly report from the dashboard.

Each export is generated entirely in the extension from data already in local
storage, wrapped in a `Blob`, and handed to `chrome.downloads.download()` as an
object URL so it is saved to the user's Downloads folder. The permission is used
only in direct response to the user clicking an export button. The extension
never downloads anything from the internet, downloads nothing in the background,
and does not read or search the user's existing download history.

---

## Remote code use

**No, I am not using remote code.**

All logic ships inside the extension package. There are no remotely hosted
scripts, no CDN or `<script src="https://…">` tags, no `eval()`, no
`new Function()`, no dynamic `import()` of external modules, and no WebAssembly
fetched at runtime. The extension makes no network requests of any kind — it
does not contact a server, because it does not have one.

---

## Data usage — certification

Focus Pulse collects no data as defined by the Chrome Web Store user data
policy. Browsing statistics (hostnames, durations, tab-switch counts) are
computed and stored locally on the user's device in `chrome.storage.local` and
are never transmitted off the device. Data leaves the device only if the user
explicitly clicks an export button, and then only into their own Downloads
folder.

On the Privacy practices tab, the truthful selections are:

- Do not tick any of the "user data" collection categories (no personally
  identifiable information, no health information, no financial information, no
  authentication information, no personal communications, no location, no web
  history transmitted, no user activity transmitted, no website content
  transmitted). Website hostnames are processed locally only and are not
  collected or transmitted.
- Tick all three certification checkboxes:
  - I do not sell or transfer user data to third parties, outside of the
    approved use cases.
  - I do not use or transfer user data for purposes that are unrelated to my
    item's single purpose.
  - I do not use or transfer user data to determine creditworthiness or for
    lending purposes.

---

## Publisher contact (resolved)

The publisher contact email on file is **sjainam141@gmail.com**, verified in the
Developer Dashboard before submission.

---

## Suggested store description (short)

Focus Pulse measures how you actually spend your browsing time — time per site,
tab switches, session length — and turns it into a daily focus score and a
7-day trend. Fully local: no account, no server, no data ever leaves your
device.
