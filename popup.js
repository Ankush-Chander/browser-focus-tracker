function getToday() {
    return new Date().toISOString().split("T")[0];
}

function calculateFocusScore(stats) {

    let score = 100;

    // Frequent tab switching reduces focus
    score -= stats.switches * 1.5;

    // Very short visits indicate distraction
    score -= stats.shortVisits * 3;

    // Too many different websites may indicate loss of focus
    const siteCount = Object.keys(stats.sites).length;

    if (siteCount > 15) {
        score -= 10;
    }

    return Math.max(
        0,
        Math.min(100, Math.round(score))
    );
}

function formatTime(ms) {

    const totalMinutes =
        Math.floor(ms / 60000);

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

async function loadStats() {

    const storage =
        await chrome.storage.local.get(
            "dailyStats"
        );

    const today =
        getToday();

    const stats =
        storage.dailyStats?.[today];

    if (!stats) {

        document.getElementById(
            "focusScore"
        ).textContent =
            "No data collected today.";

        return;
    }

    const score =
        calculateFocusScore(stats);

    const focusScoreElement =
        document.getElementById(
            "focusScore"
        );

    focusScoreElement.classList.remove(
        "good",
        "average",
        "poor"
    );

    if (score >= 80) {

        focusScoreElement.classList.add(
            "good"
        );

    }
    else if (score >= 50) {

        focusScoreElement.classList.add(
            "average"
        );

    }
    else {

        focusScoreElement.classList.add(
            "poor"
        );

    }

    focusScoreElement.textContent =
        `Focus Score: ${score}/100`;

    document.getElementById(
        "switches"
    ).textContent =
        `Tab Switches: ${stats.switches}`;

    let totalTime = 0;

    Object.values(stats.sites)
        .forEach(time => {

            totalTime += time;

        });

    const totalTimeElement =
        document.getElementById(
            "totalTime"
        );

    if (totalTimeElement) {

        totalTimeElement.textContent =
            `Total Browsing Time: ${formatTime(totalTime)}`;

    }

    const sitesContainer =
        document.getElementById(
            "sites"
        );

    sitesContainer.innerHTML = "";

    const sortedSites =
        Object.entries(stats.sites)
            .sort(
                (a, b) => b[1] - a[1]
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

            sitesContainer.appendChild(
                div
            );
        }
    );
}


document
    .getElementById("resetBtn")
    .addEventListener(
        "click",
        async () => {

            const storage =
                await chrome.storage.local.get(
                    "dailyStats"
                );

            const today =
                getToday();

            if (
                storage.dailyStats &&
                storage.dailyStats[today]
            ) {

                delete storage.dailyStats[today];

                await chrome.storage.local.set({
                    dailyStats:
                        storage.dailyStats
                });
            }

            location.reload();

        }
    );


document
    .getElementById("exportBtn")
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
                    "focus-tracker-report.json"

            });

        }
    );

document
    .getElementById(
        "dashboardBtn"
    )
    
    .addEventListener(
        "click",
    ()=>{

        chrome.tabs.create({

            url:

                chrome.runtime.getURL(
                    "dashboard.html"
                )

        });

    });


loadStats();