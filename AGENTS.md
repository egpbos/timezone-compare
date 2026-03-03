# Agent Guidelines for timezone-compare

## Project Overview

This is a simple single-page webapp for visualizing how a meeting time in one timezone maps to local times across multiple timezones over a year. Built with vanilla JavaScript, HTML, CSS, and Chart.js.

## Build & Development Commands

### Running Locally

```bash
# Using Python's built-in HTTP server
python -m http.server 8000

# Or using Node.js
npx serve .

# Then open http://localhost:8000
```

### Testing

**No test framework is currently set up.** To add tests, consider:
- Vitest for unit tests (works well with ES modules)
- Add a simple test runner script

### Linting

**No linter is configured.** To add linting:
- ESLint with a vanilla JavaScript config
- Run `npx eslint .` after setup

## Code Style Guidelines

### General Principles

- This is vanilla JavaScript (no TypeScript, no build step)
- Use ES modules (`type="module"` in script tags)
- Use semicolons at statement ends
- Use 2 spaces for indentation
- Max line length: ~100 characters (soft limit)

### Imports & Dependencies

- Chart.js is loaded via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`
- No npm dependencies - all code is self-contained
- External globals: `Chart` (from Chart.js), `window.TIMEZONES` (from timezones.js)

### Naming Conventions

- **Functions/variables**: camelCase (e.g., `getOffsetMinutes`, `chartInstance`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `STORAGE_KEY`)
- **DOM element IDs**: kebab-case matching HTML (e.g., `yearSelect`, `targetTimeZonesSelect`)
- **Files**: kebab-case (e.g., `app.js`, `timezones.js`)

### Functions

- Use `function` keyword for most functions (not arrow functions)
- Arrow functions acceptable for callbacks and concise inline functions
- Keep functions focused and reasonably sized (< 100 lines)
- Add JSDoc comments for public/helper functions explaining parameters and return values

Example from codebase:
```javascript
// Compute offset in minutes of a given timezone from UTC at a specific Date.
// Positive for zones ahead of UTC, negative for zones behind.
function getOffsetMinutes(date, timeZone) {
  // ...
}
```

### Error Handling

- Use try/catch for operations that may fail (e.g., `JSON.parse`, `localStorage`)
- Provide fallback values when errors occur
- Log errors to console with `console.error`
- Show user-friendly error messages in the UI

Example pattern:
```javascript
function loadSavedSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
```

### Types

- No TypeScript - use JSDoc for type annotations if needed
- Use descriptive variable names to convey intent
- Document complex data structures in comments

### DOM Manipulation

- Use `document.getElementById` for element selection
- Cache DOM references when used multiple times
- Use event listeners (`addEventListener`) instead of inline handlers

### State & Persistence

- Settings stored in `localStorage` under key `STORAGE_KEY`
- Use try/catch around localStorage operations (can fail in private browsing)

### CSS Guidelines

- See `styles.css` for existing patterns
- Use CSS custom properties for theme colors
- Follow BEM-like naming for component classes
- Keep styles modular and component-scoped

### Chart Configuration

- Use Chart.js 4.x UMD build
- Configure charts with responsive options
- Use consistent color palette (defined in `ensureChart` and `handleUpdate`)
- UTC baseline should use dashed gray line (`borderDash: [6, 4]`, `borderColor: "#9ca3af"`)

### Pull Request Guidelines

1. Test locally with `python -m http.server 8000` before committing
2. Ensure no console errors in browser
3. Verify chart renders correctly with multiple timezone selections

### File Organization

- `index.html` - Main HTML structure
- `app.js` - Application logic, time calculations, Chart.js integration
- `timezones.js` - Timezone list (extend as needed)
- `styles.css` - Styling

### Adding New Features

1. Add any new timezone IDs to `timezones.js`
2. Update `styles.css` for any new UI elements
3. Test with Chart.js integration if adding visualizations
