import {
  getToday,
  formatTime,
  calculateTotalTime,
  calculateFocusScore,
  zoneForScore,
  ZONE_LABEL,
  needleAngle,
} from "./utils.js";

function updateGauge(score) {
  const needleGroup = document.getElementById("needleGroup");

  needleGroup.setAttribute(
    "transform",
    `rotate(${needleAngle(score)} 100 110)`,
  );

  document.getElementById("focusScore").textContent = score;

  document.getElementById("focusLabel").textContent =
    ZONE_LABEL[zoneForScore(score)];
}

function updateTopSites(stats) {
  const container = document.getElementById("sites");

  container.innerHTML = "";

  const entries = Object.entries(stats?.sites || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  container.classList.toggle("is-empty", entries.length === 0);

  document
    .getElementById("sitesEmptyNote")
    .classList.toggle("is-visible", entries.length === 0);

  entries.forEach(([domain, time]) => {
    const li = document.createElement("li");

    const domainSpan = document.createElement("span");

    domainSpan.className = "site-domain";
    domainSpan.textContent = domain;

    const timeSpan = document.createElement("span");

    timeSpan.className = "site-time";
    timeSpan.textContent = formatTime(time);

    li.appendChild(domainSpan);
    li.appendChild(timeSpan);

    container.appendChild(li);
  });
}

// The "Most Used Today" readout was in the markup but nothing
// ever set its text - it just sat on "-" permanently. The top
// site is already the first (highest-time) entry once
// stats.sites is sorted, so reuse that instead of resorting.
function updateTopSite(stats) {
  const topSiteElement = document.getElementById("topSite");

  const entries = Object.entries(stats?.sites || {}).sort(
    (a, b) => b[1] - a[1],
  );

  if (entries.length === 0) {
    topSiteElement.textContent = "-";

    return;
  }

  const [domain, time] = entries[0];

  topSiteElement.textContent = `${domain} • ${formatTime(time)}`;
}

async function loadStats() {
  const storage = await chrome.storage.local.get("dailyStats");

  const today = getToday();

  const stats = storage.dailyStats?.[today];

  // Live tab count is real regardless of whether today's
  // stats exist yet, so it's shown independent of the
  // empty state below.
  const liveTabs = (await chrome.tabs.query({})).length;

  document.getElementById("openTabs").textContent = liveTabs;

  const readingSection = document.getElementById("readingSection");

  const totalTimeReadout = document.getElementById("totalTimeReadout");

  const switchesReadout = document.getElementById("switchesReadout");

  const maxTabsReadout = document.getElementById("maxTabsReadout");

  if (!stats) {
    readingSection.classList.add("is-empty");

    totalTimeReadout.classList.add("is-hidden");
    switchesReadout.classList.add("is-hidden");
    maxTabsReadout.classList.add("is-hidden");

    updateTopSite(null);
    updateTopSites(null);

    return;
  }

  readingSection.classList.remove("is-empty");

  totalTimeReadout.classList.remove("is-hidden");
  switchesReadout.classList.remove("is-hidden");
  maxTabsReadout.classList.remove("is-hidden");

  updateGauge(calculateFocusScore(stats));

  document.getElementById("totalTime").textContent = formatTime(
    calculateTotalTime(stats.sites),
  );

  document.getElementById("switches").textContent = stats.switches || 0;

  document.getElementById("maxTabs").textContent = stats.maxTabs || 0;

  updateTopSite(stats);
  updateTopSites(stats);
}

document.getElementById("resetBtn").addEventListener("click", async () => {
  const storage = await chrome.storage.local.get("dailyStats");

  const today = getToday();

  if (storage.dailyStats && storage.dailyStats[today]) {
    delete storage.dailyStats[today];

    await chrome.storage.local.set({
      dailyStats: storage.dailyStats,
    });
  }

  location.reload();
});

async function exportJSON() {
  try {
    const storage = await chrome.storage.local.get("dailyStats");

    const blob = new Blob([JSON.stringify(storage.dailyStats, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    try {
      await chrome.downloads.download({
        url,
        filename: `focus-tracker-${getToday()}.json`,
        saveAs: false,
        conflictAction: "uniquify",
      });

      showToast("JSON exported successfully");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("JSON export failed:", error);
    showToast("JSON export failed");
  }
}

document.getElementById("exportBtn").addEventListener("click", exportJSON);

function csvEscape(value) {
  const str = String(value);

  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._timer);

  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

async function exportCSV() {
  try {
    const storage = await chrome.storage.local.get("dailyStats");

    const dailyStats = storage.dailyStats || {};

    const header = [
      "Date",
      "Focus Score",
      "Total Time (min)",
      "Switches",
      "Site Count",
      "Max Tabs",
    ];

    const rows = Object.entries(dailyStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => {
        const totalMinutes = Math.round(
          calculateTotalTime(stats.sites) / 60000,
        );

        return [
          date,
          calculateFocusScore(stats),
          totalMinutes,
          stats.switches || 0,
          Object.keys(stats.sites || {}).length,
          stats.maxTabs || 0,
        ];
      });

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    try {
      await chrome.downloads.download({
        url,
        filename: `focus-tracker-${getToday()}.csv`,
        saveAs: false,
        conflictAction: "uniquify",
      });

      showToast("CSV exported successfully");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("CSV export failed:", error);
    showToast("CSV export failed");
  }
}

document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);

document.getElementById("dashboardBtn").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("dashboard.html"),
  });
});

loadStats();

/* -----------------------------
   Keep the popup live instead of a one-time snapshot.

   loadStats() used to run exactly once, when the popup first
   loaded. If the popup stays open for a while - dragged out
   via "Inspect popup", or just left open longer than usual -
   it would keep showing whatever was true the moment it
   opened, no matter how much time passed or how many tabs you
   switched through afterward.

   1. React immediately whenever background.js writes new data
      (auto-save alarm, tab switch, navigation, tab count
      change) - this is the primary, near-instant path.
   2. A periodic poll as a backstop, mainly so the live "Open
      Tabs" count (which isn't itself stored, so a storage
      change elsewhere doesn't always accompany it) stays
      current even if nothing else changes for a while.
------------------------------*/

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes.dailyStats || changes.currentTabCount) {
    loadStats();
  }
});

setInterval(loadStats, 15000);
