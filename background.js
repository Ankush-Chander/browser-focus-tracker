import {
    getToday,
    getDomain
} from "./utils.js";

async function initializeToday() {
    const result = await chrome.storage.local.get("dailyStats");

    const dailyStats = result.dailyStats || {};

    const today = getToday();

    if (!dailyStats[today]) {
        dailyStats[today] = {
            sites: {},
            switches: 0,
            shortVisits: 0
        };

        await chrome.storage.local.set({
            dailyStats,
            sessionStart: Date.now()
        });
    }
}

async function saveCurrentSession() {

    const storage =
        await chrome.storage.local.get([
            "activeDomain",
            "sessionStart",
            "dailyStats"
        ]);

    const domain = storage.activeDomain;
    const start = storage.sessionStart;

    if (!domain || !start) {
        return;
    }

    const duration = Date.now() - start;

    const today = getToday();

    const dailyStats =
        storage.dailyStats || {};

    if (!dailyStats[today]) {
        dailyStats[today] = {
            sites: {},
            switches: 0,
            shortVisits: 0,
            focusScore: 0,
            sessions: []
        };
    }

    dailyStats[today].sites[domain] =
        (dailyStats[today].sites[domain] || 0)
        + duration;

    if (duration < 10000) {
        dailyStats[today].shortVisits++;
    }

    await chrome.storage.local.set({
        dailyStats
    });

    console.log(
        "Saved",
        domain,
        duration
    );
}

chrome.runtime.onInstalled.addListener(async () => {

    console.log("Installed");

    await initializeToday();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {

    console.log("Tab switched");

    await saveCurrentSession();

    const tab =
        await chrome.tabs.get(
            activeInfo.tabId
        );

    if (!tab.url) return;

    if (

       tab.url.startsWith("chrome://") ||

        tab.url.startsWith("chrome-extension://") ||

        tab.url.startsWith("edge://")

    ) {

        return;

    }

    const domain =
        getDomain(tab.url);

    if (!domain) return;

    await initializeToday();

    const storage =
        await chrome.storage.local.get([
            "dailyStats",
            "activeDomain"
        ]);

    const today =
        getToday();

        if (storage.activeDomain) {
            storage.dailyStats[today].switches++;
        }

    await chrome.storage.local.set({
        dailyStats:
            storage.dailyStats,

        activeDomain:
            domain,

        sessionStart:
            Date.now()
    });

    console.log(
        "Tracking",
        domain
    );
});

setInterval(

    saveCurrentSession,

    30000

);