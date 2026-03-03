## Timezone Meeting Visualizer

A single-page webapp that lets you fix a meeting time in one timezone and see, as a line chart, how that meeting time translates to local times across multiple other timezones over the course of a year. This makes it easy to spot awkward weeks where daylight saving time changes differ between regions.

The chart also includes a **UTC baseline** line so you can quickly see how each timezone’s local time relates to UTC throughout the year.

### Running locally

From the `timezone-compare` directory:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Any other simple static HTTP server (Node, Go, Ruby, etc.) will also work; the app is just static HTML/CSS/JS.

### Files

- `index.html` – main single-page app layout and control surface.
- `styles.css` – visual styling and responsive layout.
- `timezones.js` – curated list of IANA timezones shown in the selectors (including `Etc/UTC` for the baseline).
- `app.js` – time calculations, Chart.js wiring, and state persistence.

### Hosting

You can host this on any static host:

- **GitHub Pages**:
  - Commit these files to a repository.
  - In GitHub, go to **Settings → Pages**.
  - Select the branch (e.g. `main`) and root (`/`) as the Pages source.
  - After it builds, open the provided GitHub Pages URL.

- **Apache / nginx / other web servers**:
  - Copy all files in this directory into a directory served by your web server (for Apache, typically `htdocs` or a configured VirtualHost directory).
  - Ensure the server is configured to serve static `.html`, `.css`, and `.js` files.
  - Visit the corresponding URL in your browser.

