function getToday() {
    return new Date().toISOString().split("T")[0];
}

function formatTime(ms) {
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);

    if (hrs > 0) {
        return `${hrs}h ${mins % 60}m`;
    }

    return `${mins}m`;
}

function calculateFocusScore(stats) {

    if (!stats) return 0;

    let score = 100;

    score -= (stats.switches || 0) * 1.5;
    score -= (stats.shortVisits || 0) * 3;

    const siteCount =
        Object.keys(stats.sites || {}).length;

    if (siteCount > 15) {
        score -= 10;
    }

    return Math.max(
        0,
        Math.min(100, Math.round(score))
    );
}

function calculateTotalTime(sites) {

    return Object.values(sites || {}).reduce(
        (sum, value) => sum + value,
        0
    );

}

function updateFocusCard(score) {

    const scoreElement =
        document.getElementById("focusScore");

    const labelElement =
        document.getElementById("focusLabel");

    scoreElement.textContent = `${score}/100`;

    scoreElement.className = "score";

    if (score >= 80) {

        scoreElement.classList.add("green");
        labelElement.textContent = "Highly Focused";

    }

    else if (score >= 50) {

        scoreElement.classList.add("orange");
        labelElement.textContent = "Moderately Focused";

    }

    else {

        scoreElement.classList.add("red");
        labelElement.textContent = "Distracted";

    }

}

function updateTodayStats(stats) {

    const total =
        calculateTotalTime(stats.sites);

    document.getElementById("browsingTime").textContent =
        `Total Browsing Time : ${formatTime(total)}`;

    document.getElementById("switches").textContent =
        `Tab Switches : ${stats.switches || 0}`;

    document.getElementById("siteCount").textContent =
        `Sites Visited : ${Object.keys(stats.sites || {}).length}`;

}

function updateTopSites(stats) {

    const container =
        document.getElementById("topSites");

    container.innerHTML = "";

    Object.entries(stats.sites || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([domain, time], index) => {

            const div =
                document.createElement("div");

            div.className = "site";

            div.innerHTML = `
                <strong>#${index + 1} ${domain}</strong>
                <br>
                ${formatTime(time)}
            `;

            container.appendChild(div);

        });

}

function calculateWeeklySummary(dailyStats) {

    const days =
        Object.entries(dailyStats || {})
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7);

    let totalScore = 0;
    let totalTime = 0;
    let totalSwitches = 0;

    let bestScore = -1;
    let bestDay = "-";

    let worstScore = 101;
    let worstDay = "-";

    days.forEach(([date, stats]) => {

        const score =
            calculateFocusScore(stats);

        const time =
            calculateTotalTime(stats.sites);

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

        average:
            days.length
                ? Math.round(totalScore / days.length)
                : 0,

        bestDay,
        bestScore,

        worstDay,
        worstScore,

        weeklyTime: totalTime,

        weeklySwitches: totalSwitches

    };

}

function updateWeeklySummary(dailyStats) {

    const weekly =
        calculateWeeklySummary(dailyStats);

    document.getElementById("weeklyAverage").textContent =
        `${weekly.average}/100`;

    document.getElementById("bestDay").textContent =
        `${weekly.bestDay} (${weekly.bestScore})`;

    document.getElementById("worstDay").textContent =
        `${weekly.worstDay} (${weekly.worstScore})`;

    document.getElementById("weeklyTime").textContent =
        formatTime(weekly.weeklyTime);

    document.getElementById("weeklySwitches").textContent =
        weekly.weeklySwitches;

}

function updateHistoryTable(dailyStats) {

    const body =
        document.getElementById("historyBody");

    body.innerHTML = "";

    Object.entries(dailyStats || {})
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 7)
        .forEach(([date, stats]) => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${date}</td>
                <td>${calculateFocusScore(stats)}/100</td>
                <td>${formatTime(calculateTotalTime(stats.sites))}</td>
                <td>${stats.switches || 0}</td>
            `;

            body.appendChild(row);

        });

}

function showNoData() {

    document.body.innerHTML +=
        "<h2 style='text-align:center'>No data available for today.</h2>";

}

async function loadDashboard() {

    try {

        const storage =
            await chrome.storage.local.get("dailyStats");

        const dailyStats =
            storage.dailyStats || {};

        const today =
            getToday();

        const stats =
            dailyStats[today];

        if (!stats) {

            showNoData();
            return;

        }

        updateFocusCard(
            calculateFocusScore(stats)
        );

        updateTodayStats(stats);

        updateTopSites(stats);

        updateWeeklySummary(dailyStats);

        updateHistoryTable(dailyStats);

    }

    catch (error) {

        console.error(error);

        document.body.innerHTML +=
            "<h2 style='text-align:center'>Unable to load dashboard.</h2>";

    }

}

loadDashboard();