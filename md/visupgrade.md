# Visualisation & Playback Analytics Upgrade Plan (visupgrade.md)

## Objective
Enhance data interpretation, session duration calculation, and visualisations for Twitch GDPR archive exports: specifically `video_play.csv`, `minutes_watched.csv`, `chat_messages.csv`, and related sequential event files (channel switches, ad renders, chat streams, redemptions, predictions).

---

## 1. Engine & Algorithmic Foundation: Inferred Watch Duration & Session Reconstruction
- [x] Create `src/utils/durationInference.ts`:
  - **Sequential Timestamp Delta Calculator**:
    - Detect timestamp fields (`time`, `timestamp`, `epoch_time`, `played_at`, `date`, `created_at`, `started_at`).
    - Sort rows chronologically.
    - Calculate delta to next sequential playback event or channel switch:
      - Continuous session: If `delta <= 120` minutes (or user switches channel within reasonable viewing window), `inferredDuration = delta`.
      - Session boundary: If `delta > 120` minutes or next event is on a different day, treat as distinct session end and assign a calculated session floor.
    - Detect direct duration metrics if already supplied (`minutes_watched`, `duration_seconds`, `length`, `play_duration`, `watch_time`) and normalise alongside inferred session deltas.
  - **Session Clustering & Channel Hopping Analysis**:
    - Group consecutive watches into continuous "Viewing Sessions" / "Binge Blocks".
    - Calculate Channel Hopping Velocity (frequency of switching between streams).
    - Aggregate statistics: Total Session Time, Inferred Watch Hours, Channel Switch Count, Average Session Length, Longest Viewing Marathon.

---

## 2. Playback & Video Play Enhancements (`WatchTimeReportView.tsx` & Data Normalisation)
- [x] **First 15 Lines Logical Inspector & Duration Step-by-Step Breakdown**:
  - Interactive "Inferred Duration & Switch Audit" modal highlighting the first 15 records and illustrating how channel switch timestamps translate into calculated watch durations.
- [x] **Multi-Dimensional Visualisation Modes**:
  - *Timeline Velocity*: Watch minutes over time with daily/monthly granularity.
  - *Streamer Leaderboard*: 3D / Bar rankings of total hours and calculated session minutes.
  - *Category & Device Distributions*: Breakdowns by game/category and viewing platform.
  - *Session Hopping Heatmap / Viewing Marathons*: Longest continuous sessions and peak viewing hours.
- [x] **Rich Table Display**:
  - Show Streamer Badge with Twitch link, Category pill, Event Timestamp, Channel Switch Delta, Calculated Watch Duration, Device/Platform, and deep Inspection Trigger.

---

## 3. Chat Messages Visualisation & Content Upgrades (`ChatReportView.tsx`)
- [x] **Chat Intelligence & Emote Velocity**:
  - Message volume timeline (daily/monthly/hourly trends).
  - Top Chat Rooms / Streamer channels with percentage of total chat output.
  - Peak Activity Hours (24-hour distribution chart).
  - Emote & Keyword token frequency extraction and interactive keyword filters.
- [x] **Interactive Message Browser**:
  - Filter by Channel/Streamer, Date Range, and Search Keywords.
  - Deep Inspection Modal displaying exact timestamp, channel url, room context, and raw log payload.

---

## 4. Universal Event Duration & Sequence Inference across Archive Files
- [x] Specialised reports (`SubscriptionsReportView.tsx`, `BitsReportView.tsx`, `ChannelPointsReportView.tsx`, `LoginHistoryReportView.tsx`, `GenericCsvReportView.tsx`):
  - Normalised channel extractors, streamer avatar badges, direct twitch links, and financial and duration metrics.

---

## 5. Visual Consistency & Theme Integration
- [x] Ensured all visualisers, 3D WebGL scenes, bar/scatter/trendline charts, badges, and modals respect the active Color Palette (`twitch`, `cyberpunk`, `emerald`, `amber`).
- [x] Dynamic style synchronization on default style change.
- [x] Polished responsive typography, card spacing, and interactive filters.
