# InsightBoard

A polished, responsive Power BI-inspired analytics dashboard built with plain HTML, CSS, and JavaScript. It is designed as a frontend MVP that runs directly in a browser with no build step.

## Features

- Responsive analytics dashboard UI
- Revenue trend and sales-channel charts powered by Chart.js
- KPI cards, activity feed, product ranking, reports and datasets views
- CSV and JSON import with local browser storage
- Dataset preview table
- New report modal and favorite reports
- Fully responsive sidebar/mobile layout

## Run locally

No installation is required. Open `index.html` in a modern browser. For best results use a local static server:

```bash
python -m http.server 8080
```

Then visit <http://localhost:8080>.

## Import format

CSV files should include a header row, for example:

```csv
Month,Revenue,Orders
Jan,81000,180
Feb,92000,210
Mar,105000,245
```

Imported data is stored in `localStorage` for this demo. A production version should connect the upload flow to an authenticated API and database.

## Project structure

- `index.html` - application markup and view structure
- `styles.css` - responsive visual system
- `app.js` - navigation, charts, import, local storage, and interactions

## Next production steps

Add authentication, PostgreSQL persistence, server-side file processing, role-based sharing, drag-and-drop report editing, and scheduled data refreshes.
