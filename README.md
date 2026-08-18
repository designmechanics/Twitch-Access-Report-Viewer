# Twitch Access Report Viewer

A fast, privacy-first, 100% client-side inspector and analytics suite for exploring Twitch.tv GDPR and CCPA Data Subject Access Reports (DSAR).

Twitch Access Report Viewer unpacks your official Twitch data export archives entirely in local browser memory. It instantly indexes data tables, filters active records from empty schema templates, and provides interactive visual analytics for your chat logs, watch time history, subscriptions, bits cheers, security events, and account telemetry: with zero data leaving your machine.

---

## Key Features

* **100% Client-Side Privacy**: All zip decompression, CSV parsing, and JSON traversal execute directly in your browser using Web APIs and in-memory blobs. No server uploads, no cookies, and no tracking.
* **Archive Diagnostic Engine**: Automatic detection and separation of active data tables vs empty schema templates (which Twitch generates for unused platform features).
* **UTF-8 BOM & Schema Sanitation**: Strips UTF-8 Byte Order Marks (`\uFEFF`), normalises irregular Twitch column naming conventions, and handles whitespace cleanly.
* **Specialised Report Views**:
  * **Chat History**: Searchable message logs with channel breakdowns, action tags, and temporal sorting.
  * **Watch Time & Broadcasts**: Total hours watched, top streamers, game category breakdowns, and device analytics.
  * **Subscriptions**: Active subscriptions, tier levels, cumulative tenure counters, and gifted sub logs.
  * **Bits & Cheers**: Cheer totals, streamer contributions, and custom message memos.
  * **Security & Login History**: Authentication timestamps, IP addresses, geographical locations, and 2FA status.
  * **Channel Points**: Custom rewards claimed, point burn rates, and fulfillment tracking.
  * **User Profile & Account Info**: JSON tree explorer for profile credentials, notification settings, and linked integrations.
* **Universal Data Grid & Raw Inspector**: Inspect any arbitrary CSV with sticky headers, pagination, column sorting, or switch to the syntax-highlighted raw file viewer.
* **One-Click Export**: Export individual uncorrupted dataset files on demand.

---

## Tech Stack

* **Frontend Framework**: React 19 with TypeScript
* **Build System**: Vite
* **Styling**: Tailwind CSS with dark-mode aesthetic
* **Archive Parsing**: JSZip
* **CSV Engine**: PapaParse
* **Icons**: Lucide React

---

## Getting Started

### Prerequisites

* Node.js (v18.0.0 or higher)
* npm, pnpm, or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/twitch-access-report.git
   cd twitch-access-report
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## Production Build

To build the project for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## How to Get Your Twitch Data Archive

1. Log in to your account on [Twitch.tv](https://www.twitch.tv).
2. Go to **Settings** &rarr; **Security and Privacy**.
3. Scroll down to the **Download Your Data** section and click **Request Data Copy**.
4. Twitch will email you a link once your `.zip` archive is ready.
5. Drag and drop the downloaded `.zip` file directly into this app.

---

## Privacy & Security

Your Twitch data contains personal telemetry including IP logs, chat logs, and account identifiers. This tool is built specifically to safeguard that data:
* **Zero Network Requests**: The application makes no external API calls for data processing.
* **Ephemeral Memory**: Datasets are held in volatile browser memory and cleared immediately upon tab close or reset.

---

## License

MIT License. Feel free to use, modify, and distribute.
