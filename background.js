function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function saveCurrentSession() {
  const data = await chrome.storage.local.get([
    "activeDomain",
    "sessionStart",
    "websites"
  ]);

  const activeDomain = data.activeDomain;
  const sessionStart = data.sessionStart;

  if (!activeDomain || !sessionStart) return;

  const duration = Date.now() - sessionStart;

  const websites = data.websites || {};

  websites[activeDomain] =
    (websites[activeDomain] || 0) + duration;

  await chrome.storage.local.set({
    websites
  });
}

chrome.runtime.onSuspend.addListener(async () => {
  await saveCurrentSession();
});

chrome.windows.onFocusChanged.addListener(
  async (windowId) => {

    if (
      windowId ===
      chrome.windows.WINDOW_ID_NONE
    ) {

      await saveCurrentSession();

    }
  }
);

chrome.runtime.onInstalled.addListener(() => {

  chrome.storage.local.set({
    websites: {},
    tabSwitches: 0
  });

});

chrome.tabs.onActivated.addListener(async (activeInfo) => {

  await saveCurrentSession();

  const tab = await chrome.tabs.get(activeInfo.tabId);

  if (!tab.url) return;

  const domain = getDomain(tab.url);

  if (
    domain === null ||
    tab.url.startsWith("chrome://")
  ) {
    return;
  }

  const data =
    await chrome.storage.local.get("initialized");

  if (data.initialized) {

    const stats =
      await chrome.storage.local.get("tabSwitches");

    await chrome.storage.local.set({
      tabSwitches: (stats.tabSwitches || 0) + 1
    });

  } else {

    await chrome.storage.local.set({
      initialized: true
    });

  }

  await chrome.storage.local.set({
    activeDomain: domain,
    sessionStart: Date.now()
  });

});