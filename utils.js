export function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function formatTime(ms) {
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins % 60}m`;
  }

  return `${mins}m`;
}

export function calculateTotalTime(sites) {
  return Object.values(sites || {}).reduce((sum, value) => sum + value, 0);
}

export function calculateFocusScore(stats) {
  if (!stats) return 0;

  let score = 100;

  score -= (stats.switches || 0) * 1.5;
  score -= (stats.shortVisits || 0) * 3;

  const siteCount = Object.keys(stats.sites || {}).length;

  if (siteCount > 15) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/* Score zones shared by the popup gauge, dashboard gauge,
   and dashboard trend strip - one place so they can never
   disagree with each other. */

export function zoneForScore(score) {
  if (score >= 80) return "high";
  if (score >= 50) return "mid";
  return "low";
}

export const ZONE_LABEL = {
  high: "Highly focused",
  mid: "Moderately focused",
  low: "Distracted",
};

export function needleAngle(score) {
  return (score / 100) * 180 - 90;
}

/* Letter grade from a 0-100 score. Lives next to zoneForScore so
   the grade boundaries and the score/zone boundaries can't quietly
   drift apart from each other. Used by the dashboard's Insights
   card and weekly report. */

export function getGradeLetter(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  return "D";
}
