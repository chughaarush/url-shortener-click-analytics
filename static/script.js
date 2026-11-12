
/* =====================================
   1. ELEMENT REFERENCES
===================================== */

const shortenForm = document.getElementById("shortenForm");
const originalUrlInput = document.getElementById("originalUrl");
const shortenButton = document.getElementById("shortenButton");

const resultCard = document.getElementById("resultCard");
const shortUrlElement = document.getElementById("shortUrl");
const copyButton = document.getElementById("copyButton");
const copyButtonText = document.getElementById("copyButtonText");

const statusMessage = document.getElementById("statusMessage");
const clickCount = document.getElementById("clickCount");

const analyticsButton = document.getElementById("analyticsButton");
const analyticsPanel = document.getElementById("analyticsPanel");
const clickHistory = document.getElementById("clickHistory");

const recentSection = document.getElementById("recentSection");
const recentLinks = document.getElementById("recentLinks");
const clearHistoryButton = document.getElementById("clearHistoryButton");

const toast = document.getElementById("toast");

let currentShortUrl = "";
let currentShortCode = "";
let toastTimer;


/* =====================================
   2. SHORTEN URL
===================================== */

shortenForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const originalUrl = originalUrlInput.value.trim();

    if (!originalUrl) {
        showStatus("Please enter a URL first.", "error");
        return;
    }

    resultCard.hidden = true;
    analyticsPanel.hidden = true;

    showStatus("", "");

    shortenButton.disabled = true;
    shortenButton.querySelector(".button-text").textContent =
        "Creating link...";

    try {

        const response = await fetch("/shorten", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                url: originalUrl
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Unable to shorten this URL."
            );
        }

        // Get response from FastAPI
        currentShortUrl = data.short_url;
        currentShortCode = data.short_code;

        if (!currentShortUrl || !currentShortCode) {
            throw new Error("Incomplete response from server.");
        }

        // Display short URL
        shortUrlElement.textContent = currentShortUrl;
        shortUrlElement.href = currentShortUrl;

        clickCount.textContent = "—";

        copyButtonText.textContent = "Copy link";
        copyButton.classList.remove("copied");

        resultCard.hidden = false;

        // Save link in browser history
        saveRecentLink(
            originalUrl,
            currentShortUrl,
            currentShortCode
        );

        showStatus("Your new link is ready to share.", "success");

        resultCard.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        // Load initial analytics
        await loadAnalytics(false);

    } catch (error) {

        showStatus(error.message, "error");

    } finally {

        shortenButton.disabled = false;

        shortenButton.querySelector(".button-text").textContent =
            "Shorten link";

    }

});


/* =====================================
   3. COPY CURRENT SHORT URL
===================================== */

copyButton.addEventListener("click", async function () {

    if (!currentShortUrl) return;

    try {

        await navigator.clipboard.writeText(currentShortUrl);

        copyButtonText.textContent = "Copied!";
        copyButton.classList.add("copied");

        showToast("Link copied to clipboard.");

        setTimeout(() => {

            copyButtonText.textContent = "Copy link";
            copyButton.classList.remove("copied");

        }, 1800);

    } catch (error) {

        showToast("Unable to copy. Copy the link manually.");

    }

});


/* =====================================
   4. CURRENT LINK ANALYTICS
===================================== */

analyticsButton.addEventListener("click", async function () {

    const isOpen = !analyticsPanel.hidden;

    analyticsPanel.hidden = isOpen;

    if (!isOpen) {
        await loadAnalytics(true);
    }

});


async function loadAnalytics(showHistory = true) {

    if (!currentShortCode) return;

    try {

        const response = await fetch(
            `/analytics/${encodeURIComponent(currentShortCode)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Unable to load analytics."
            );
        }

        clickCount.textContent = data.total_clicks;

        if (showHistory) {
            renderClickHistory(data.click_history || []);
        }

    } catch (error) {

        if (showHistory) {

            clickHistory.replaceChildren();

            const item = document.createElement("li");
            item.textContent = error.message;

            clickHistory.appendChild(item);

        }

    }

}


/* =====================================
   5. RENDER CURRENT CLICK HISTORY
===================================== */

function renderClickHistory(history) {

    clickHistory.replaceChildren();

    if (history.length === 0) {

        const item = document.createElement("li");
        item.textContent = "No clicks recorded yet.";

        clickHistory.appendChild(item);
        return;

    }

    history.slice().reverse().slice(0, 10).forEach(time => {

        const item = document.createElement("li");

        const date = new Date(time);

        item.textContent = Number.isNaN(date.getTime())
            ? String(time)
            : date.toLocaleString();

        clickHistory.appendChild(item);

    });

}


/* =====================================
   6. RECENT LINKS STORAGE
===================================== */

function getRecentLinks() {

    try {

        return JSON.parse(
            localStorage.getItem("linklyRecentLinks")
        ) || [];

    } catch (error) {

        return [];

    }

}


function saveRecentLink(originalUrl, shortUrl, shortCode) {

    const history = getRecentLinks();

    const newLink = {
        originalUrl: originalUrl,
        shortUrl: shortUrl,
        shortCode: shortCode,
        createdAt: new Date().toISOString()
    };

    history.unshift(newLink);

    localStorage.setItem(
        "linklyRecentLinks",
        JSON.stringify(history.slice(0, 10))
    );

    renderRecentLinks();

}


/* =====================================
   7. DISPLAY RECENT LINKS
===================================== */

function renderRecentLinks() {

    const history = getRecentLinks();

    recentLinks.replaceChildren();

    if (history.length === 0) {

        recentSection.hidden = true;
        return;

    }

    recentSection.hidden = false;

    history.forEach(link => {

        const item = document.createElement("div");
        item.className = "recent-item";

        // Link information
        const info = document.createElement("div");
        info.className = "recent-item-info";

        const shortLink = document.createElement("a");
        shortLink.href = link.shortUrl;
        shortLink.target = "_blank";
        shortLink.rel = "noopener noreferrer";
        shortLink.textContent = link.shortUrl;

        const originalLink = document.createElement("span");
        originalLink.textContent = link.originalUrl;
        originalLink.title = link.originalUrl;

        info.append(shortLink, originalLink);

        // Action buttons
        const actions = document.createElement("div");
        actions.className = "recent-actions";

        const analyticsBtn = document.createElement("button");
        analyticsBtn.className = "recent-analytics";
        analyticsBtn.textContent = "Analytics";
        analyticsBtn.type = "button";
        analyticsBtn.dataset.code = link.shortCode;

        const copyBtn = document.createElement("button");
        copyBtn.className = "recent-copy";
        copyBtn.textContent = "Copy";
        copyBtn.type = "button";
        copyBtn.dataset.url = link.shortUrl;

        actions.append(analyticsBtn, copyBtn);

        item.append(info, actions);

        recentLinks.appendChild(item);

    });

}


/* =====================================
   8. HISTORY COPY BUTTON
===================================== */

recentLinks.addEventListener("click", async function (event) {

    const button = event.target.closest(".recent-copy");

    if (!button) return;

    try {

        await navigator.clipboard.writeText(button.dataset.url);

        showToast("Link copied to clipboard.");

    } catch (error) {

        showToast("Unable to copy this link.");

    }

});


/* =====================================
   9. HISTORY ANALYTICS BUTTON
===================================== */

recentLinks.addEventListener("click", async function (event) {

    const button = event.target.closest(".recent-analytics");

    if (!button) return;

    const shortCode = button.dataset.code;

    button.disabled = true;
    button.textContent = "Loading...";

    try {

        // Fetch analytics for this particular history link
        const response = await fetch(
            `/analytics/${encodeURIComponent(shortCode)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Unable to load analytics."
            );
        }

        // Find the correct history card
        const item = button.closest(".recent-item");

        let panel = item.querySelector(
            ".recent-analytics-panel"
        );

        if (!panel) {

            panel = document.createElement("div");
            panel.className = "recent-analytics-panel";

            item.appendChild(panel);

        }

        panel.replaceChildren();

        // Total clicks
        const heading = document.createElement("strong");

        heading.textContent =
            `Total clicks: ${data.total_clicks}`;

        // Click history
        const historyList = document.createElement("ul");

        const history = data.click_history || [];

        if (history.length === 0) {

            const li = document.createElement("li");
            li.textContent = "No clicks recorded yet.";

            historyList.appendChild(li);

        } else {

            history.slice().reverse().slice(0, 10)
                .forEach(time => {

                    const li = document.createElement("li");

                    const date = new Date(time);

                    li.textContent = Number.isNaN(date.getTime())
                        ? String(time)
                        : date.toLocaleString();

                    historyList.appendChild(li);

                });

        }

        panel.append(heading, historyList);

        showToast("Analytics loaded.");

    } catch (error) {

        showToast(error.message);

    } finally {

        button.disabled = false;
        button.textContent = "Analytics";

    }

});


/* =====================================
   10. CLEAR HISTORY
===================================== */

clearHistoryButton.addEventListener("click", function () {

    localStorage.removeItem("linklyRecentLinks");

    renderRecentLinks();

    showToast("Recent history cleared.");

});


/* =====================================
   11. STATUS MESSAGES
===================================== */

function showStatus(message, type) {

    statusMessage.textContent = message;

    statusMessage.className = "status-message";

    if (type) {
        statusMessage.classList.add(type);
    }

}


/* =====================================
   12. TOAST NOTIFICATIONS
===================================== */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* =====================================
   13. INITIALIZE APP
===================================== */

renderRecentLinks();


