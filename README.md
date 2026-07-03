# BigQuery Release Pulse

A premium, modern web application built with **Python Flask** and plain vanilla **HTML, CSS, and JavaScript** that fetches the official BigQuery Release Notes RSS/Atom feed and provides a sleek dashboard to view, filter, and share updates on X (Twitter).

---

## 🚀 Features

- 🔄 **Real-time Feed Syncing**: Fetches the official Google Cloud BigQuery RSS/Atom feed dynamically.
- 🎨 **Sleek Glassmorphic Design**: A modern dark mode dashboard featuring smooth gradients, glowing components, and micro-interactions.
- 📊 **Update Analytics**: Real-time stats counting the number of Features, Changes, and Announcements in the current feed.
- 🔍 **Instant Search & Filtering**: Live search by keywords or instant filtering using semantic category badges (*Feature, Change, Announcement, Breaking, Issue*).
- 🐦 **Smart X (Twitter) Composer**: 
  - Select any release note to open a floating share composer.
  - Automatically formats the post content within X's 280-character limit, applying **smart truncation** where needed.
  - Prefills the release date, update type, description, hashtags (`#GoogleCloud #BigQuery`), and a direct link to the official documentation.

---

## 📁 File Structure

```text
bq-releases-notes/
├── app.py                # Flask server, fetches and parses Atom feed into JSON
├── templates/
│   └── index.html        # Main dashboard UI using semantic HTML5
├── static/
│   ├── style.css         # Styling system (glassmorphic dark theme)
│   └── main.js           # AJAX fetch, filtering logic, and tweet compiler
├── .gitignore            # Git exclusion rules for Python caches/IDE files
└── README.md             # Project documentation
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Make sure you have **Python 3.x** installed. Install the single dependency (**Flask**) using pip:
```bash
pip install Flask
```

### 2. Running Locally
Run the Flask server from the project directory:
```bash
python app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser to access the dashboard.

---

## ☁️ Deployment

To deploy this application to Google Cloud Run, run the following command in the project root:

```bash
gcloud run deploy bigquery-release-pulse --source . --allow-unauthenticated
```
*(This command automatically builds the container using Google Cloud Buildpacks, deploys it to Cloud Run, and exposes a public HTTP URL)*
