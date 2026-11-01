
Meridian · Clock and World Clock
A standalone Meridian preview in dark navy and gold. Clock, World Clock, Stopwatch, Countdown, and Study are separate working tabs. There is no admin/editor sidebar, sign-in, backend, or publishing endpoint.

This is a separate preview package. It does not modify or deploy to the public Meridian site.

Run locally
From this folder:


 ./start-local-preview.sh
 
Open http://127.0.0.1:8765/. Stop the server with `Ctrl+C`.

Alternatively, on any system with Python 3:


 python3 -m http.server 8765 --bind 127.0.0.1
 
No build step or runtime dependency installation is needed. The app uses project-relative asset paths and works as a GitHub Pages project site under `/New-clock-/`.

GitHub Pages deployment
This package is designed to sit at the repository root and serve at `https://drnithishbalaji-spec.github.io/New-clock-/`. `index.html` loads `./styles.css` and `./app.js`, so both assets resolve under the `/New-clock-/` project path; no root-absolute asset paths or build step are used.

Keep the repository’s existing `.github/workflows/pages.yml`: it uploads the repository root as the Pages artifact and deploys on pushes to `main` (or a manual workflow run). The package does not add or replace that workflow. After the owner has write access, copy the package’s root files into the repository root and confirm GitHub Pages is configured to use GitHub Actions. This local package has not been published.

Working features
Clock: The local analog/digital clock, date, and 12-hour presentation remain the home tab.

World Clock: A separate top-level tab starts with London, Tokyo, and New York. Use + Add place to search cities (including Sydney, Singapore, New Delhi, and many more) or any browser-supported IANA time zone, then add or remove clocks. Each card shows its local time, date, and current UTC offset, including daylight-saving changes. Your chosen list is saved in this browser; if storage is blocked, edits still work until the page closes.

Stopwatch: Start, pause, resume, and reset. Record any number of laps while running; each row shows its split duration and cumulative elapsed time. Pause before resetting. Laps remain until reset or reload.

Countdown: Set hours, minutes, and seconds, then start, pause, resume, reset, or start again after completion. Zero-duration starts are rejected. Editing a paused duration explicitly starts a fresh configured countdown. Inputs are bounded to 0–99 hours and 0–59 minutes/seconds.

Study/Pomodoro: Set focus length from 1–180 minutes and break length from 1–60 minutes. Start, pause, resume, reset, or choose a phase while idle. Completing focus records one session and prepares the break; completing the break prepares the next focus. The next phase waits for you to press Start rather than starting automatically. Interrupted/reset sessions and breaks are not counted as completed focus.

Study log: Completed focus sessions show duration and local completion time, with today’s focus minutes and session count. All entries remain available in a scrollable log. Clear log asks for confirmation. Chosen study lengths and completed sessions are remembered with browser `localStorage`.

Local data and timer behavior
Study data stays in this browser on this device; it is not uploaded or synced. A different browser, device, or site address has a separate log. Clearing browser/site storage also clears its saved history. When storage is blocked, the timers still work and the page warns that the in-memory log will not survive closing or reloading.

The timers use timestamp-based elapsed time/deadlines, not accumulated interval ticks. They catch up when a background/suspended page resumes. Completion messages are visible and announced through status regions. This preview is not an operating-system alarm: keep the page open. Reloading or closing resets active timers and stopwatch laps; only completed study history and study settings persist.

All five tabs respond to mouse/touch clicks and support Left/Right arrow keys, Home, and End. Controls have labels and keyboard focus indicators. Layouts are tested at desktop, 390px, and 320px widths.

Browser tests
See TESTING.md. The included Chromium regression suite checks every tab and its actual state transitions, not just visual presence. Tested desktop/mobile screenshots and the latest passing result are in `preview/`.

Files
	•	`index.html`, `styles.css`, `app.js` — complete static application
	•	`start-local-preview.sh` — loopback-only local server
	•	`tests/test_preview.py`, `requirements-dev.txt` — optional browser test tooling
	•	`preview/` — tested preview screenshots and machine-readable results

No external fonts, libraries, analytics, editor code, API keys, or new deployment workflow are required. Preserve the repository’s existing Pages workflow when copying these files.
