---
title: Install
description: How to install Focus Pulse from the Chrome Web Store, or load it unpacked for development.
---

# Install

## From the Chrome Web Store

Focus Pulse is pending its first Chrome Web Store release. Once published, the
listing link will appear here.

!!! note "Store listing not live yet"
    Until then, use the unpacked install below. It is the same code — the store
    package is built from this repository without modification.

## Load unpacked (developers)

Focus Pulse has no build step. There is nothing to compile, bundle, or install
— the repository *is* the extension.

1. Clone the repository:

    ```bash
    git clone https://github.com/Jainam249/browser-focus-tracker.git
    ```

2. Open `chrome://extensions` in Chrome.

3. Turn on **Developer mode** using the toggle in the top-right corner.

4. Click **Load unpacked**.

5. Select the cloned `browser-focus-tracker` folder.

Focus Pulse starts measuring immediately. Click the toolbar icon for today's
score, or open the dashboard from the popup for the weekly view.

## Permissions you will be asked for

Chrome will list the permissions at install time. Each one is used entirely on
your device — [the privacy policy explains what each is for](privacy.md#why-each-permission-is-requested).

| Permission | Why |
| --- | --- |
| `tabs` | Read the active tab's hostname, count switches and open tabs |
| `storage` | Save your statistics locally |
| `idle` | Stop the clock when you step away |
| `alarms` | Checkpoint the session so Chrome's suspension doesn't lose it |
| `downloads` | Save exports to your Downloads folder when you ask |

## Incognito

Chrome does not run extensions in Incognito windows unless you explicitly allow
it in `chrome://extensions`. Left at the default, Focus Pulse records nothing
while you browse in Incognito.

## Uninstalling

Remove the extension from `chrome://extensions`. All of its stored data is
deleted with it — there is no server-side copy, because there is no server.
