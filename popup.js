import {
getToday
} from "./utils.js";

const productiveSites = [
"github.com",
"leetcode.com",
"stackoverflow.com",
"developer.mozilla.org",
"docs.oracle.com"
];

const distractingSites = [
"youtube.com",
"instagram.com",
"facebook.com",
"reddit.com",
"x.com",
"twitter.com"
];

function classifySite(domain) {


if (productiveSites.includes(domain)) {
    return "productive";
}

if (distractingSites.includes(domain)) {
    return "distracting";
}

return "neutral";


}

function calculateFocusScore(
stats,
productiveTime,
distractingTime,
neutralTime
) {
let score = 100;


score -= stats.switches * 1.5;
score -= stats.shortVisits * 3;

const siteCount =
    Object.keys(stats.sites).length;

if (siteCount > 15) {
    score -= 10;
}

const totalTime =
    productiveTime +
    distractingTime +
    neutralTime;

const productiveRatio =
    totalTime > 0
        ? productiveTime / totalTime
        : 0;

const distractingRatio =
    totalTime > 0
        ? distractingTime / totalTime
        : 0;

score += Math.round(
    productiveRatio * 20
);

score -= Math.round(
    distractingRatio * 15
);

return Math.max(
    0,
    Math.min(
        100,
        Math.round(score)
    )
);


}

function formatTime(ms) {

const mins =
    Math.floor(ms / 60000);

const hrs =
    Math.floor(mins / 60);

const remaining =
    mins % 60;

if (hrs > 0) {
    return `${hrs}h ${remaining}m`;
}

return `${mins}m`;


}

async function loadStats() {

const storage =
    await chrome.storage.local.get(
        "dailyStats"
    );

const today =
    getToday();

const stats =
    structuredClone(
        storage.dailyStats?.[today]
    );

if (!stats) {

    document.getElementById(
        "focusScore"
    ).textContent =
        "No data collected today.";

    return;
}

const {
    activeDomain,
    sessionStart
} = await chrome.storage.local.get([
    "activeDomain",
    "sessionStart"
]);

if (
    activeDomain &&
    sessionStart &&
    stats.sites
) {
    const extra =
        Date.now() - sessionStart;

    stats.sites[activeDomain] =
        (stats.sites[activeDomain] || 0)
        + extra;
}

let productiveTime = 0;
let distractingTime = 0;
let neutralTime = 0;

Object.entries(stats.sites)
    .forEach(([domain, time]) => {

        const category =
            classifySite(domain);

        if (
            category ===
            "productive"
        ) {
            productiveTime += time;
        }
        else if (
            category ===
            "distracting"
        ) {
            distractingTime += time;
        }
        else {
            neutralTime += time;
        }
    });

const totalTime =
    productiveTime +
    distractingTime +
    neutralTime;

const score =
    calculateFocusScore(
        stats,
        productiveTime,
        distractingTime,
        neutralTime
    );

const scoreElement =
    document.getElementById(
        "focusScore"
    );

scoreElement.textContent =
    `Focus Score: ${score}/100`;

if (score >= 80) {
    scoreElement.className =
        "good";
}
else if (score >= 50) {
    scoreElement.className =
        "average";
}
else {
    scoreElement.className =
        "poor";
}

document.getElementById(
    "switches"
).textContent =
    `Tab Switches: ${stats.switches}`;

document.getElementById(
    "productiveTime"
).textContent =
    `Productive Time: ${formatTime(productiveTime)}`;

document.getElementById(
    "distractingTime"
).textContent =
    `Distracting Time: ${formatTime(distractingTime)}`;

document.getElementById(
    "neutralTime"
).textContent =
    `Neutral Time: ${formatTime(neutralTime)}`;

const totalTimeElement =
    document.getElementById(
        "totalTime"
    );

if (totalTimeElement) {
    totalTimeElement.textContent =
        `Total Time: ${formatTime(totalTime)}`;
}

const sitesContainer =
    document.getElementById(
        "sites"
    );

sitesContainer.innerHTML = "";

const sortedSites =
    Object.entries(stats.sites)
    .sort(
        (a, b) =>
            b[1] - a[1]
    )
    .slice(0, 10);

sortedSites.forEach(
    ([domain, time]) => {

        const div =
            document.createElement(
                "div"
            );

        div.className = "site";

        div.textContent =
            `${domain} - ${formatTime(time)}`;

        sitesContainer.appendChild(div);
    }
);

}

document
.getElementById(
"resetBtn"
)
.addEventListener(
"click",
async () => {


        const storage =
            await chrome.storage.local.get(
                "dailyStats"
            );

        const today =
            getToday();

        delete storage.dailyStats[today];

        await chrome.storage.local.set({
            dailyStats:
                storage.dailyStats
        });

        location.reload();
    }
);


document
.getElementById(
"exportBtn"
)
.addEventListener(
"click",
async () => {
        const storage =
            await chrome.storage.local.get(
                "dailyStats"
            );

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        storage.dailyStats,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        chrome.downloads.download({
            url,
            filename:
                "focus-report.json"
        });
    }
);

loadStats();
