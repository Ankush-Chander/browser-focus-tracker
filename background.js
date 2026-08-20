import { getToday, getDomain } from "./utils.js";

/* -----------------------------
   Debug logging - gated behind a flag so instrumentation can
   stay in the source (useful for diagnosing issues in the
   wild, where you can't attach a debugger to a user's
   browser) without spamming the console by default. Flip
   DEBUG to true locally when you need it.
------------------------------*/

const DEBUG = false;

function log(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

/* -----------------------------
   NOTE ON SERVICE WORKER LIFECYCLE
   Manifest V3 service workers can be killed and
   restarted by Chrome at any time (e.g. after ~30s
   idle). In-memory variables do NOT survive that.
   chrome.storage.local DOES. So: chrome.storage is
   always treated as the source of truth for whether
   a session is active - never an in-memory flag.
------------------------------*/

let isSaving = false;
let focusLossTimer = null;

const AUTO_SAVE_ALARM = "focusPulseAutoSave";

// 5 minutes, not the previous 60 seconds. chrome.idle only
// measures physical keyboard/mouse input - 60s is far too
// aggressive for normal behavior like reading an article or
// watching a video without touching the mouse, which was
// causing long sessions to be undercounted. 5 minutes matches
// what most productivity trackers use as a "genuinely away"
// threshold. Tradeoff: genuine idle time (stepped away, left
// the tab open) now takes up to 5 minutes to get caught,
// instead of 1.
chrome.idle.setDetectionInterval(300);

/* -----------------------------
   Serialize all dailyStats read-modify-write
   operations. Several listeners (tab switch, tab
   created/removed, auto-save alarm) can fire close
   together; without serializing, two concurrent
   "read old value, write new value" sequences can
   silently clobber each other (lost update).
------------------------------*/

let storageQueue = Promise.resolve();

function withStorageLock(task) {
  const run = storageQueue.then(task, task);

  storageQueue = run.then(
    () => {},
    () => {},
  );

  return run;
}

function emptyDayStats() {
  return {
    sites: {},

    switches: 0,

    shortVisits: 0,

    maxTabs: 0,
  };
}

/* -----------------------------
   Initialize today's statistics
------------------------------*/

async function initializeToday() {
  return withStorageLock(async () => {
    const result = await chrome.storage.local.get("dailyStats");

    const dailyStats = result.dailyStats || {};

    const today = getToday();

    if (!dailyStats[today]) {
      dailyStats[today] = emptyDayStats();

      await chrome.storage.local.set({
        dailyStats,
      });
    }
  });
}

/* -----------------------------
   Track open tab count
------------------------------*/

async function updateTabCount() {
  const tabs = await chrome.tabs.query({});

  const count = tabs.length;

  return withStorageLock(async () => {
    const today = getToday();

    const storage = await chrome.storage.local.get("dailyStats");

    const dailyStats = storage.dailyStats || {};

    if (!dailyStats[today]) {
      dailyStats[today] = emptyDayStats();
    }

    dailyStats[today].maxTabs = Math.max(dailyStats[today].maxTabs || 0, count);

    await chrome.storage.local.set({
      dailyStats,

      currentTabCount: count,
    });
  });
}

/* -----------------------------
   Save current browsing session

   Source of truth is chrome.storage (activeDomain +
   sessionStart), not an in-memory flag, so this stays
   correct even if the service worker was restarted
   since the session started.
------------------------------*/

async function saveCurrentSession({ countShortVisit = true } = {}) {
  log("Saving session");
  if (isSaving) return;

  isSaving = true;

  try {
    await withStorageLock(async () => {
      const storage = await chrome.storage.local.get([
        "activeDomain",
        "sessionStart",
        "dailyStats",
      ]);

      const domain = storage.activeDomain;
      const start = storage.sessionStart;

      if (!domain || !start) return;

      const duration = Date.now() - start;
      log(
        "SAVE:",
        "domain =",
        domain,
        "| duration =",
        Math.round(duration / 1000),
        "| sessionStart =",
        start,
      );

      if (duration <= 0) return;

      const today = getToday();

      const dailyStats = storage.dailyStats || {};

      if (!dailyStats[today]) {
        dailyStats[today] = emptyDayStats();
      }

      dailyStats[today].sites[domain] =
        (dailyStats[today].sites[domain] || 0) + duration;

      // Only count this as a "short visit" (and apply its
      // score penalty) when the session ended because the
      // person deliberately navigated away within personal
      // Chrome - switching tabs or loading a new URL. A
      // session cut short because personal Chrome itself
      // lost focus (minimized, switched to another Chrome
      // profile, went idle) isn't the person bouncing
      // between sites - it's an interruption outside the
      // browser, and shouldn't be scored as one.
      if (countShortVisit && duration < 10000) {
        dailyStats[today].shortVisits++;
      }

      // This write was missing - without it, everything above
      // is computed correctly in memory and then discarded.
      // sessionStart is refreshed too, so the next save
      // measures from here forward instead of re-counting the
      // same elapsed time twice.
      await chrome.storage.local.set({
        dailyStats,
        sessionStart: Date.now(),
      });
    });
  } finally {
    isSaving = false;
  }
}

/* -----------------------------
   Start tracking a domain
------------------------------*/

async function startTracking(domain, url) {
  if (!domain || !url) return;

  await chrome.storage.local.set({
    activeDomain: domain,
    activeUrl: url,
    sessionStart: Date.now(),
  });
}

/* -----------------------------
   Detect and start tracking whatever tab is already active.

   Tracking normally only begins via tabs.onActivated (switch
   tabs) or tabs.onUpdated (navigate to a new URL). Neither of
   those fires just because the extension starts up - if the
   browser just launched, or the extension was just reloaded,
   and the person is already sitting on a tab without touching
   it, nothing was ever tracking that tab. They could sit there
   for an hour and it would still read 0m. Call this from
   onInstalled/onStartup to close that gap.
------------------------------*/

async function trackCurrentActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  const tab = tabs[0];

  if (!tab || !tab.url) return;

  if (isIgnoredPage(tab.url)) return;

  const domain = getDomain(tab.url);

  if (!domain) return;

  await startTracking(domain, tab.url);
}

async function stopTracking() {
  // No in-memory gate here on purpose - always attempt
  // to save/clear, since storage (not memory) tells us
  // whether there was really a session in progress.
  // countShortVisit: false - stopTracking always represents
  // an interruption (lost focus, idle, locked), never the
  // person deliberately hopping to a different site.
  log("stopTracking called");
  await saveCurrentSession({ countShortVisit: false });

  await chrome.storage.local.remove("sessionStart");
}

/* -----------------------------
   Clear the "currently tracked domain" pointer entirely.

   Different from stopTracking(), which only pauses (keeps
   activeDomain so tracking can resume the same session later).
   This is for when the active tab has moved to somewhere that
   was never tracked in the first place - closed the tracked
   tab and landed on chrome://newtab, navigated to an ignored
   page, etc. Without this, activeDomain stays pointed at
   whatever site was last tracked, and every auto-save after
   that keeps silently adding time to that stale domain even
   though the tab isn't open anymore. Always call
   saveCurrentSession() first to bank whatever time had
   genuinely accumulated before this point.
------------------------------*/

async function clearActiveTracking() {
  await chrome.storage.local.remove([
    "activeDomain",
    "activeUrl",
    "sessionStart",
  ]);
}

async function resumeTracking() {
  const active = await chrome.storage.local.get("activeDomain");

  if (!active.activeDomain) return;

  const session = await chrome.storage.local.get("sessionStart");

  if (!session.sessionStart) {
    await chrome.storage.local.set({
      sessionStart: Date.now(),
    });
  }
}

/* -----------------------------
   Ignore browser pages
------------------------------*/

function isIgnoredPage(url) {
  if (!url) return true;

  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  );
}

/* -----------------------------
   Is the active tab playing audio/video?

   chrome.idle only sees keyboard/mouse input, so watching a
   video or listening to something with no physical input for
   5+ minutes would otherwise get flagged "idle" and stop the
   clock mid-session. If the active tab is audible, we treat
   that as a sign the person is still genuinely engaged and
   skip the idle-triggered stop.
------------------------------*/

async function isActiveTabAudible() {
  const tabs = await chrome.tabs.query({
    active: true,

    currentWindow: true,
  });

  const tab = tabs[0];

  return !!(tab && tab.audible);
}

/* -----------------------------
   Auto-save alarm (survives service worker restarts,
   unlike setInterval)
------------------------------*/

chrome.alarms.create(AUTO_SAVE_ALARM, {
  periodInMinutes: 1,
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  log("Alarm fired:", alarm.name);

  // Must be async + awaited here. If this listener returns
  // before the write to chrome.storage actually finishes,
  // Chrome can treat the listener as "done" and suspend the
  // service worker mid-save - silently dropping that minute's
  // checkpoint. This alarm is often the ONLY thing waking the
  // worker during a long single-tab session (e.g. watching a
  // video with no tab switches), so a dropped save here
  // directly shows up as missing time on the dashboard.
  if (alarm.name !== AUTO_SAVE_ALARM) return;

  // Periodic checkpoint only.
  // Never count an auto-save as a short visit.
  await saveCurrentSession({
    countShortVisit: false,
  });
});

/* -----------------------------
   Extension Installed
------------------------------*/

chrome.runtime.onInstalled.addListener(async () => {
  await initializeToday();

  await updateTabCount();

  await chrome.storage.local.remove([
    "activeDomain",
    "activeUrl",
    "sessionStart",
  ]);

  await trackCurrentActiveTab();
});

/* -----------------------------
   Tab Switched
------------------------------*/

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await saveCurrentSession();

  const tab = await chrome.tabs.get(activeInfo.tabId);

  const domain = tab.url ? getDomain(tab.url) : null;

  if (!tab.url || isIgnoredPage(tab.url) || !domain) {
    // Switched to a tab that isn't tracked (chrome://newtab,
    // the extensions page, etc). saveCurrentSession() above
    // already banked whatever time had genuinely accumulated -
    // clear the pointer so nothing keeps silently accruing
    // against the previous domain, which may not even have a
    // tab open anymore.
    await clearActiveTracking();

    return;
  }

  await initializeToday();

  await withStorageLock(async () => {
    const storage = await chrome.storage.local.get([
      "dailyStats",
      "activeDomain",
    ]);

    const today = getToday();

    storage.dailyStats = storage.dailyStats || {};

    if (!storage.dailyStats[today]) {
      storage.dailyStats[today] = emptyDayStats();
    }

    if (storage.activeDomain) {
      storage.dailyStats[today].switches++;

      await chrome.storage.local.set({
        dailyStats: storage.dailyStats,
      });
    }
  });

  await startTracking(domain, tab.url);
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeToday();

  await updateTabCount();

  await chrome.storage.local.remove([
    "activeDomain",
    "activeUrl",
    "sessionStart",
  ]);

  await trackCurrentActiveTab();
});

/* -----------------------------
   URL Changed
------------------------------*/

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  log("onUpdated:", changeInfo);
  // Ignore updates that are not page navigations
  if (!changeInfo.url) return;

  if (!tab.active) return;

  const domain = tab.url ? getDomain(tab.url) : null;

  if (!tab.url || isIgnoredPage(tab.url) || !domain) {
    // Navigated the active tab to a page that isn't tracked
    // (chrome://newtab, an internal page, etc). Bank whatever
    // time had genuinely accumulated on the previous domain,
    // then clear the pointer - otherwise it stays pointed at
    // that domain and every auto-save after this keeps
    // silently adding time to it.
    await saveCurrentSession();

    await clearActiveTracking();

    return;
  }

  const storage = await chrome.storage.local.get("activeDomain");

  // Same website → don't start a new session
  if (storage.activeDomain === domain) return;

  await saveCurrentSession();

  await startTracking(domain, tab.url);
});

/* -----------------------------
   Catch the case where audio stops (video ends, tab muted,
   etc.) while the system is already sitting in the idle
   state. chrome.idle.onStateChanged only fires on state
   transitions, so without this, tracking would keep running
   silently until the person eventually touches the mouse.
------------------------------*/

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.audible !== false) return;

  const idleState = await chrome.idle.queryState(60);

  if (idleState === "idle" || idleState === "locked") {
    await stopTracking();
  }
});

/* -----------------------------
   Window focus lost / regained

   Simple and immediate: personal Chrome focused = tracking
   runs, personal Chrome not focused (minimized, or focus moved
   to a different Chrome profile / another app entirely) =
   tracking pauses right away. No grace period, no debounce.

   This used to also cost score points on quick switches, since
   pausing mid-visit could count as a "short visit." That's
   fixed at the source in saveCurrentSession() instead (see
   stopTracking) - so a quick pause is exempt from the penalty
   without needing to delay the pause itself.
------------------------------*/

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  log("Window focus:", windowId);

  // Browser temporarily lost focus
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    clearTimeout(focusLossTimer);

    focusLossTimer = setTimeout(async () => {
      const windows = await chrome.windows.getAll({
        populate: false,
        windowTypes: ["normal"],
      });

      // If no Chrome window is focused after 300 ms,
      // then this is a real focus loss.
      const hasFocusedWindow = windows.some((w) => w.focused);

      if (!hasFocusedWindow) {
        await stopTracking();
      }
    }, 300);

    return;
  }

  // Focus came back quickly (zoom menu, DevTools, etc.)
  clearTimeout(focusLossTimer);

  await resumeTracking();
});

chrome.idle.onStateChanged.addListener(async (state) => {
  if (state === "idle") {
    // "locked" always stops tracking below - the person
    // actually left. Plain "idle" (just no input) gets
    // one exception: if the active tab is playing audio,
    // that's still genuine engagement, so don't stop.
    if (await isActiveTabAudible()) {
      return;
    }

    await stopTracking();
  }

  if (state === "locked") {
    await stopTracking();
  }

  if (state === "active") {
    await resumeTracking();
  }
});

/* -----------------------------
   Open Tab Count Changed
------------------------------*/

chrome.tabs.onCreated.addListener(updateTabCount);

chrome.tabs.onRemoved.addListener(updateTabCount);

chrome.tabs.onAttached.addListener(updateTabCount);

chrome.tabs.onDetached.addListener(updateTabCount);

/* -----------------------------
   Best-effort save on suspend. NOT guaranteed to fire
   before a service worker is evicted - the alarm above
   is the real safety net, this is just a bonus.
------------------------------*/

chrome.runtime.onSuspend.addListener(async () => {
  await saveCurrentSession({ countShortVisit: false });
});
