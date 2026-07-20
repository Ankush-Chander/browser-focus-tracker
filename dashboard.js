import {
  getToday,
  formatTime,
  calculateTotalTime,
  calculateFocusScore,
  zoneForScore,
  ZONE_LABEL,
  needleAngle,
} from "./utils.js";

/* -----------------------------
   Gauge (the reading section's signature element)
------------------------------*/

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

/* -----------------------------
   Shared: letter grade from a 0-100 score. Used by both
   today's Insights card and the weekly report.
------------------------------*/

function getGradeLetter(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  return "D";
}

/* -----------------------------
   Today's readouts
------------------------------*/

function updateTodayStats(stats) {
  const total = calculateTotalTime(stats.sites);

  document.getElementById("browsingTime").textContent = formatTime(total);

  document.getElementById("switches").textContent = stats.switches || 0;

  document.getElementById("siteCount").textContent = Object.keys(
    stats.sites || {},
  ).length;

  document.getElementById("maxTabs").textContent = stats.maxTabs || 0;
}

function updateTopSites(stats) {
  const container = document.getElementById("topSites");

  container.innerHTML = "";

  const entries = Object.entries(stats.sites || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const totalTime = calculateTotalTime(stats.sites);

  container.classList.toggle("is-empty", entries.length === 0);

  entries.forEach(([domain, time]) => {
    const percentage =
      totalTime > 0 ? ((time / totalTime) * 100).toFixed(1) : 0;

    const li = document.createElement("li");

    li.className = "site-card";

    li.innerHTML = `
            <div class="site-header">
                <span class="site-domain">${domain}</span>
                <span class="site-percent">${percentage}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${percentage}%"></div>
            </div>
            <div class="site-time">${formatTime(time)}</div>
        `;

    container.appendChild(li);
  });
}

/* -----------------------------
   Weekly summary + trend strip
------------------------------*/

function calculateWeeklySummary(dailyStats) {
  const daysDesc = Object.entries(dailyStats || {})
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);

  let totalScore = 0;
  let totalTime = 0;
  let totalSwitches = 0;

  let bestScore = -1;
  let bestDay = "-";

  let worstScore = 101;
  let worstDay = "-";

  daysDesc.forEach(([date, stats]) => {
    const score = calculateFocusScore(stats);

    const time = calculateTotalTime(stats.sites);

    totalScore += score;
    totalTime += time;
    totalSwitches += stats.switches || 0;

    if (score > bestScore) {
      bestScore = score;
      bestDay = date;
    }

    if (score < worstScore) {
      worstScore = score;
      worstDay = date;
    }
  });

  return {
    average: daysDesc.length ? Math.round(totalScore / daysDesc.length) : 0,

    bestDay,
    bestScore,

    worstDay,
    worstScore,

    weeklyTime: totalTime,

    weeklySwitches: totalSwitches,

    // oldest -> newest, for the trend strip (reads
    // left to right like a strip-chart recording)
    orderedDays: [...daysDesc].reverse().map(([date, stats]) => ({
      date,
      score: calculateFocusScore(stats),
    })),
  };
}

function renderTrend(orderedDays) {
  const container = document.getElementById("trend");

  container.innerHTML = "";

  if (!orderedDays.length) {
    return;
  }

  orderedDays.forEach(({ date, score }) => {
    const bar = document.createElement("div");

    bar.className = "trend-bar";
    bar.setAttribute("data-zone", zoneForScore(score));

    const fill = document.createElement("div");

    fill.className = "trend-bar-fill";
    fill.style.height = `${Math.max(4, score)}%`;
    fill.title = `${date}: ${score}/100`;

    const label = document.createElement("div");

    label.className = "trend-bar-label";

    // "07" from "2026-07-09" -> use day of month for a
    // compact, always-fits label
    label.textContent = date.slice(-2);

    bar.appendChild(fill);
    bar.appendChild(label);

    container.appendChild(bar);
  });
}

function updateWeeklySummary(weekly) {
  document.getElementById("weeklyAverage").textContent =
    `${weekly.average}/100`;

  document.getElementById("bestDay").textContent =
    weekly.bestScore >= 0 ? `${weekly.bestDay} (${weekly.bestScore})` : "--";

  document.getElementById("worstDay").textContent =
    weekly.worstScore <= 100
      ? `${weekly.worstDay} (${weekly.worstScore})`
      : "--";

  document.getElementById("weeklyTime").textContent = formatTime(
    weekly.weeklyTime,
  );

  document.getElementById("weeklySwitches").textContent = weekly.weeklySwitches;

  renderTrend(weekly.orderedDays);
}

function updateWeeklyDelta(dailyStats) {
  const allDaysAsc = Object.entries(dailyStats || {}).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const element = document.getElementById("weeklyDelta");

  if (allDaysAsc.length < 14) {
    element.textContent = "Need 2 weeks of data";
    return;
  }

  const current = allDaysAsc.slice(-7);
  const previous = allDaysAsc.slice(-14, -7);

  const currentAverage = Math.round(
    current.reduce((sum, [, stats]) => sum + calculateFocusScore(stats), 0) /
      current.length,
  );

  const previousAverage = Math.round(
    previous.reduce((sum, [, stats]) => sum + calculateFocusScore(stats), 0) /
      previous.length,
  );

  const delta = currentAverage - previousAverage;

  if (delta > 0) {
    element.textContent = `▲ Improved by ${delta} points`;
  } else if (delta < 0) {
    element.textContent = `▼ Down by ${Math.abs(delta)} points`;
  } else {
    element.textContent = "No change from last week";
  }
}

/* -----------------------------
   History log
------------------------------*/

function updateHistoryTable(dailyStats) {
  const body = document.getElementById("historyBody");

  body.innerHTML = "";

  const rows = Object.entries(dailyStats || {})
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);

  rows.forEach(([date, stats]) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${date}</td>
            <td>${calculateFocusScore(stats)}/100</td>
            <td>${formatTime(calculateTotalTime(stats.sites))}</td>
            <td>${stats.switches || 0}</td>
            <td>${stats.maxTabs || 0}</td>
        `;

    body.appendChild(row);
  });

  document
    .getElementById("logEmptyNote")
    .classList.toggle("is-visible", rows.length === 0);
}

/* -----------------------------
   Today's insights
------------------------------*/

function updateInsights(stats) {
  const totalTime = calculateTotalTime(stats.sites);

  const sessions = (stats.switches || 0) + 1;

  const average = sessions > 0 ? totalTime / sessions : totalTime;

  let longest = 0;

  Object.values(stats.sites || {}).forEach((time) => {
    if (time > longest) {
      longest = time;
    }
  });

  document.getElementById("longestSession").textContent = formatTime(longest);

  document.getElementById("averageSession").textContent = formatTime(average);

  const score = calculateFocusScore(stats);

  document.getElementById("productivityGrade").textContent =
    getGradeLetter(score);

  let tip = "Great work today!";

  if (stats.switches > 80) {
    tip = "Try reducing frequent tab switching.";
  } else if (Object.keys(stats.sites).length > 15) {
    tip = "Too many websites visited today.";
  } else if (score >= 90) {
    tip = "Excellent focus! Keep this routine.";
  } else if (score < 60) {
    tip = "Consider using fewer tabs for deep work.";
  }

  document.getElementById("productivityTip").textContent = tip;
}

/* -----------------------------
   Weekly report (downloadable summary)

   Reuses the same "longest/average session" approximation the
   Insights card uses for a single day, just applied across the
   week's combined totals: there's no per-session record kept
   in storage (only cumulative time per site per day), so "top
   site's total time" stands in for "longest session" and
   "total time / (switches + 1)" stands in for "average
   session" - an estimate, not an exact session log, same as
   in updateInsights above.
------------------------------*/

function calculateWeeklyTopSite(dailyStats) {
  const totals = {};

  Object.values(dailyStats || {}).forEach((stats) => {
    Object.entries(stats.sites || {}).forEach(([domain, time]) => {
      totals[domain] = (totals[domain] || 0) + time;
    });
  });

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  return entries.length ? entries[0] : null;
}

function calculateWeeklyLongestSite(dailyStats) {
  let longest = 0;

  Object.values(dailyStats || {}).forEach((stats) => {
    Object.values(stats.sites || {}).forEach((time) => {
      if (time > longest) {
        longest = time;
      }
    });
  });

  return longest;
}

function updateWeeklyReport(dailyStats, weekly) {
  const topSite = calculateWeeklyTopSite(dailyStats);

  const sessions = (weekly.weeklySwitches || 0) + 1;

  const averageSession =
    sessions > 0 ? weekly.weeklyTime / sessions : weekly.weeklyTime;

  const longestSession = calculateWeeklyLongestSite(dailyStats);

  document.getElementById("reportAverage").textContent =
    `${weekly.average}/100`;

  document.getElementById("reportBestDay").textContent =
    weekly.bestScore >= 0 ? `${weekly.bestDay} (${weekly.bestScore})` : "--";

  document.getElementById("reportWorstDay").textContent =
    weekly.worstScore <= 100
      ? `${weekly.worstDay} (${weekly.worstScore})`
      : "--";

  document.getElementById("reportBrowsing").textContent = formatTime(
    weekly.weeklyTime,
  );

  document.getElementById("reportSwitches").textContent = weekly.weeklySwitches;

  document.getElementById("reportTopSite").textContent = topSite
    ? topSite[0]
    : "-";

  document.getElementById("reportLongest").textContent =
    formatTime(longestSession);

  document.getElementById("reportAverageSession").textContent =
    formatTime(averageSession);

  document.getElementById("reportGrade").textContent = getGradeLetter(
    weekly.average,
  );
}

/* -----------------------------
   Masthead date
------------------------------*/

function renderDateline() {
  document.getElementById("dateline").textContent =
    new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
}

/* -----------------------------
   Load
------------------------------*/

async function loadDashboard() {
  try {
    const storage = await chrome.storage.local.get("dailyStats");

    const dailyStats = storage.dailyStats || {};

    const today = getToday();

    const stats = dailyStats[today];

    renderDateline();

    const readingSection = document.getElementById("readingSection");

    const insightsBlock = document.getElementById("insightsBlock");

    const topSitesBlock = document.getElementById("topSitesBlock");

    if (stats) {
      readingSection.classList.remove("is-empty");

      updateGauge(calculateFocusScore(stats));
      updateTodayStats(stats);
      updateTopSites(stats);
      updateInsights(stats);

      insightsBlock.style.display = "";
      topSitesBlock.style.display = "";
    } else {
      readingSection.classList.add("is-empty");

      // No data for today yet - hide the two blocks
      // that only make sense with today's data, but
      // keep weekly signal / log / report visible below
      // since they can still show past days.
      insightsBlock.style.display = "none";
      topSitesBlock.style.display = "none";
    }

    // Weekly signal, the log, and the weekly report all use
    // the full week of data, so they render regardless of
    // whether today has anything logged yet.
    const weekly = calculateWeeklySummary(dailyStats);

    if (weekly) {
      updateWeeklySummary(weekly);
    }

    updateWeeklyDelta(dailyStats);

    updateHistoryTable(dailyStats);

    updateWeeklyReport(dailyStats, weekly);
  } catch (error) {
    console.error(error);

    const sheet = document.querySelector(".sheet");

    const message = document.createElement("p");

    message.className = "empty-note is-visible";
    message.innerHTML = `

      <strong>Unable to load dashboard.</strong>

      <br><br>

      Please refresh the page or try again.

    `;

    sheet.prepend(message);
  }
}

loadDashboard();

document.getElementById("downloadWeeklyReport").addEventListener(
  "click",

  async () => {
    const report = `
FOCUS TRACKER
WEEKLY REPORT

==========================

Average Focus Score :
${document.getElementById("reportAverage").textContent}

Best Day :
${document.getElementById("reportBestDay").textContent}

Needs Improvement :
${document.getElementById("reportWorstDay").textContent}

Weekly Browsing :
${document.getElementById("reportBrowsing").textContent}

Tab Switches :
${document.getElementById("reportSwitches").textContent}

Most Used Website :
${document.getElementById("reportTopSite").textContent}

Longest Session :
${document.getElementById("reportLongest").textContent}

Average Session :
${document.getElementById("reportAverageSession").textContent}

Productivity Grade :
${document.getElementById("reportGrade").textContent}

Generated :
${new Date().toLocaleString()}
`;

    const blob = new Blob([report], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url,

      filename: `weekly-report-${new Date().toISOString().split("T")[0]}.txt`,
    });
  },
);
