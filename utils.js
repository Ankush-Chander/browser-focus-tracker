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