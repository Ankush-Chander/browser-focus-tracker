# 🧠 Focus Pulse

**[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/focuspulse/gcffkhpmcpjkmjmjeeiigbnjieoaennn)** &middot; **[Documentation](https://jainam249.github.io/browser-focus-tracker/)**

A **privacy-first Chrome Extension** that helps users understand and improve their browsing habits by tracking website usage, measuring focus, and providing insightful analytics—all while keeping data stored **locally on the user's device**.

---

## 📌 Overview

Focus Pulse is designed to help users become more aware of their browsing behavior without compromising their privacy.

Unlike cloud-based productivity tools, this extension stores all browsing statistics locally using the Chrome Storage API. No personal browsing data is sent to external servers.

The extension monitors website usage, calculates a daily focus score, provides productivity insights, and displays trends through an interactive dashboard.

---

## ✨ Features

### 📊 Activity Tracking

- Track time spent on each website
- Monitor active browser sessions
- Detect browser focus and idle states
- Count tab switches
- Track the maximum number of simultaneously open tabs

### 🎯 Focus Analysis

- Daily Focus Score
- Productivity Grade (A–D)
- Focus Zone classification
- Longest browsing session
- Average session length

### 📈 Dashboard Analytics

- Daily statistics overview
- Weekly productivity summary
- 7-day activity history
- Best and worst browsing days
- Top visited websites
- Productivity insights

### 📁 Data Export

- Export browsing history as JSON
- Export statistics as CSV
- Weekly report generation

### 🎨 User Experience

- Modern responsive interface
- Toast notifications
- Empty-state handling
- Professional dashboard layout

### 🔒 Privacy

- 100% local storage
- No backend server
- No cloud synchronization
- No user accounts
- No personal browsing data collected

---

# 🛠️ Technology Stack

- Chrome Extension Manifest V3
- JavaScript (ES6+)
- HTML5
- CSS3
- Chrome Storage API
- Chrome Tabs API
- Chrome Alarms API
- Chrome Downloads API

---

# 📂 Project Structure

```
browser-focus-tracker/
│
│
├── icons/
│
├── background.js          # Background tracking engine
├── dashboard.html         # Analytics dashboard
├── dashboard.js           # Dashboard logic
├── dashboard.css          # Dashboard styling
│
├── popup.html             # Extension popup
├── popup.js               # Popup logic
├── popup.css              # Popup styling
│
├── tokens.css             # Shared design tokens
├── utils.js               # Shared helper functions
│
├── manifest.json          # Chrome extension configuration
│
├── docs/                  # MkDocs site sources (documentation website)
├── mkdocs.yml             # Documentation site configuration
├── requirements-docs.txt  # Documentation toolchain (mkdocs-material)
│
├── STORE_LISTING.md       # Chrome Web Store submission answers
└── README.md
```

---

# ⚙️ Installation

## From the Chrome Web Store (recommended)

Focus Pulse is published on the Chrome Web Store:

**https://chromewebstore.google.com/detail/focuspulse/gcffkhpmcpjkmjmjeeiigbnjieoaennn**

Click **Add to Chrome**, confirm the permissions prompt, and pin the icon to
your toolbar. Chrome keeps the extension updated automatically.

## Load unpacked (development)

There is no build step — the repository *is* the extension.

1. Clone this repository

```
git clone https://github.com/Jainam249/browser-focus-tracker.git
```

2. Open Chrome

3. Navigate to

```
chrome://extensions
```

4. Enable **Developer Mode**

5. Click **Load unpacked**

6. Select the project folder

7. The extension is now ready to use.

---

# 🚀 How It Works

The extension continuously monitors the currently active browser tab while the browser window is focused.

It records:

- Time spent on each website
- Tab switches
- Browsing sessions
- Daily statistics

Using this information, the extension calculates a Focus Score and generates productivity insights displayed in both the popup and the analytics dashboard.

---

# 📊 Focus Score

The Focus Score is calculated using browsing behavior, including:

- Time spent browsing
- Number of tab switches
- Number of short browsing sessions
- Browsing consistency

The score is translated into a productivity grade ranging from **A** to **D**.

---

# 🔐 Privacy

Focus Pulse follows a **local-first architecture**.

- No external servers
- No cloud storage
- No account required
- No analytics
- No tracking outside the browser
- User data never leaves the device unless explicitly exported

---

# 🌱 Future Improvements

Possible future enhancements include:

- Dark mode
- Custom productivity goals
- Monthly reports
- Focus session reminders
- Website categorization
- Weight the focus score by time-of-day and session length. The
  current formula (flat -1.5 per switch, -3 per short visit, -10
  if more than 15 sites) is a straightforward v1 heuristic and
  doesn't yet account for when a session happened or how long it
  ran.

---

# 📚 Documentation Website

The user-facing documentation lives in `docs/` and is published as a static site
with [MkDocs](https://www.mkdocs.org/) using the
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme.

**Live site:** https://jainam249.github.io/browser-focus-tracker/

```
docs/
├── index.md            # Overview / landing page
├── install.md          # Install from the store or unpacked
├── how-it-works.md     # Tracking model and focus score formula
├── privacy.md          # Privacy policy (the URL used on the store listing)
├── changelog.md        # Release history
└── stylesheets/
    └── extra.css       # Theme overrides and design tokens
```

The site configuration — navigation, theme, palette, markdown extensions — is
in `mkdocs.yml`. Only the documentation site needs Python; the extension itself
has no dependencies.

## How to preview the site locally

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-docs.txt
mkdocs serve
```

Open http://127.0.0.1:8000 — the site rebuilds and reloads on every save.

## How to edit or add a page

1. Edit the relevant Markdown file in `docs/`, or create a new one.
2. If you added a page, register it under `nav:` in `mkdocs.yml`, otherwise it
   will not appear in the navigation.
3. Keep the YAML front matter (`title`, `description`) at the top of each page —
   it drives the page title and search/social descriptions.
4. Preview with `mkdocs serve` before committing.

## How to build and deploy

```bash
mkdocs build          # renders the static site into site/ (git-ignored)
mkdocs gh-deploy      # builds and pushes to the gh-pages branch
```

`mkdocs gh-deploy` publishes to GitHub Pages at the `site_url` configured in
`mkdocs.yml`. Run it from `main` with a clean working tree.

> **Note:** the **Privacy** page is the privacy policy URL registered on the
> Chrome Web Store listing. If its path ever changes, update the listing in the
> Developer Dashboard to match.

---

# 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

Feel free to fork the repository and submit a pull request.

---

# 👨‍💻 Author

**Jainam Shah**

Built as a privacy-first browser productivity tool using Chrome Extension Manifest V3.
