const STORAGE_KEY = "timezone-meeting-visualizer-settings";

// ---------- Utility: time + timezone helpers ----------

function pad2(n) {
  return n.toString().padStart(2, "0");
}

// Compute offset in minutes of a given timezone from UTC at a specific Date.
// Positive for zones ahead of UTC, negative for zones behind.
function getOffsetMinutes(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date);
  const map = {};
  for (const { type, value } of parts) {
    map[type] = value;
  }

  const localIso = `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}.000Z`;
  const localAsUtc = Date.parse(localIso);
  const utc = date.getTime();

  return (localAsUtc - utc) / 60000;
}

// Given a local date (in the base timezone) and hh:mm in that timezone,
// return the corresponding UTC timestamp in ms.
function getInstantForLocal(baseYear, monthIndex, dayOfMonth, hh, mm, baseTimeZone) {
  // Start with an approximate UTC time based on midnight UTC of that date.
  const approxUtc = Date.UTC(baseYear, monthIndex, dayOfMonth, hh, mm, 0);
  const approxDate = new Date(approxUtc);

  const offsetMinutes = getOffsetMinutes(approxDate, baseTimeZone);

  // Local time = UTC + offset
  // So to get UTC, subtract the offset.
  return approxUtc - offsetMinutes * 60000;
}

// Convert a UTC timestamp (ms) to local hour + minute in a given timezone.
function convertInstantToLocal(utcMs, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = dtf.formatToParts(new Date(utcMs));
  const map = {};
  for (const { type, value } of parts) {
    map[type] = value;
  }

  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  return { hour, minute, fractional: hour + minute / 60 };
}

// Generate one data series per target timezone for a whole year.
function generateYearlySeries({ year, baseTimeZone, hh, mm, targets }) {
  const labels = [];
  const datasets = targets.map((tz) => ({
    label: tz,
    data: [],
  }));

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    const monthIndex = d.getUTCMonth();
    const dayOfMonth = d.getUTCDate();

    const utcInstant = getInstantForLocal(year, monthIndex, dayOfMonth, hh, mm, baseTimeZone);

    const labelDate = new Date(Date.UTC(year, monthIndex, dayOfMonth));
    labels.push(labelDate.toISOString().slice(0, 10)); // yyyy-mm-dd

    targets.forEach((tz, idx) => {
      const local = convertInstantToLocal(utcInstant, tz);
      datasets[idx].data.push(local.fractional);
    });
  }

  return { labels, datasets };
}

function getDefaultYear() {
  return new Date().getFullYear();
}

function getDefaultBaseTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Stockholm";
  } catch {
    return "Europe/Stockholm";
  }
}

function loadSavedSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function encodeConfigToUrl(params) {
  const url = new URL(window.location.href);
  url.search = "";
  if (params.year) url.searchParams.set("y", params.year);
  if (params.baseTimeZone) url.searchParams.set("b", params.baseTimeZone);
  if (params.time) {
    url.searchParams.set("t", params.time);
  } else if (params.hh !== undefined && params.mm !== undefined) {
    url.searchParams.set("t", `${pad2(params.hh)}:${pad2(params.mm)}`);
  }
  if (params.targets && params.targets.length > 0) {
    url.searchParams.set("z", params.targets.join(","));
  }
  return url.toString();
}

function decodeUrlToConfig() {
  const params = new URLSearchParams(window.location.search);
  const year = params.get("y");
  const baseTimeZone = params.get("b");
  const time = params.get("t");
  const targets = params.get("z");

  if (!year && !baseTimeZone && !time && !targets) {
    return null;
  }

  return {
    year: year ? parseInt(year, 10) : null,
    baseTimeZone: baseTimeZone || null,
    time: time || null,
    targets: targets ? targets.split(",") : [],
  };
}

function saveSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function initControls() {
  const yearSelect = document.getElementById("yearSelect");
  const baseTzSelect = document.getElementById("baseTimeZoneSelect");
  const targetTzSelect = document.getElementById("targetTimeZonesSelect");
  const timeInput = document.getElementById("timeInput");
  const updateButton = document.getElementById("updateButton");
  const shareButton = document.getElementById("shareButton");
  const statusMessage = document.getElementById("statusMessage");

  const currentYear = getDefaultYear();
  const urlConfig = decodeUrlToConfig();
  const saved = loadSavedSettings();

  // Apply settings: URL params first, then saved settings, then defaults
  const effectiveYear = urlConfig?.year || saved?.year || currentYear;
  const effectiveBaseTimeZone = urlConfig?.baseTimeZone || saved?.baseTimeZone || getDefaultBaseTimeZone();
  const effectiveTime = urlConfig?.time || saved?.time || "09:00";
  const effectiveTargets = urlConfig?.targets?.length > 0 ? urlConfig.targets : (saved?.targets || null);

  // Populate year select: previous, current, next
  const years = [currentYear - 1, currentYear, currentYear + 1];
  years.forEach((year) => {
    const opt = document.createElement("option");
    opt.value = String(year);
    opt.textContent = String(year);
    yearSelect.appendChild(opt);
  });

  // Populate timezone selects
  const tzList = Array.isArray(window.TIMEZONES) ? window.TIMEZONES : [];
  tzList.forEach((tz) => {
    const optBase = document.createElement("option");
    optBase.value = tz.id;
    optBase.textContent = tz.label;
    baseTzSelect.appendChild(optBase);

    const optTarget = document.createElement("option");
    optTarget.value = tz.id;
    optTarget.textContent = tz.label;
    targetTzSelect.appendChild(optTarget);
  });

  // Set control values
  yearSelect.value = String(effectiveYear);
  baseTzSelect.value = effectiveBaseTimeZone;
  timeInput.value = effectiveTime;

  // Restore selected target timezones
  if (Array.isArray(effectiveTargets)) {
    const values = new Set(effectiveTargets);
    for (const option of targetTzSelect.options) {
      option.selected = values.has(option.value);
    }
  } else {
    // Sensible default: a few major regions
    const defaults = [
      "America/Los_Angeles",
      "America/New_York",
      "Europe/Stockholm",
      "Asia/Singapore",
      "Asia/Tokyo",
    ];
    const defaultsSet = new Set(defaults);
    for (const option of targetTzSelect.options) {
      if (defaultsSet.has(option.value)) {
        option.selected = true;
      }
    }
  }

  function collectParams() {
    const year = parseInt(yearSelect.value, 10);
    const baseTimeZone = baseTzSelect.value;
    const [hhStr, mmStr] = (timeInput.value || "09:00").split(":");
    const hh = parseInt(hhStr ?? "9", 10);
    const mm = parseInt(mmStr ?? "0", 10);
    const targets = Array.from(targetTzSelect.selectedOptions).map(
      (o) => o.value
    );
    return { year, baseTimeZone, hh, mm, targets };
  }

  let chartInstance = null;

  function ensureChart(ctx) {
    if (chartInstance) {
      return chartInstance;
    }

    const palette = [
      "#38bdf8",
      "#a855f7",
      "#22c55e",
      "#f97316",
      "#eab308",
      "#f472b6",
      "#2dd4bf",
      "#60a5fa",
      "#facc15",
      "#c4b5fd",
    ];

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "nearest",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#e5e7eb",
            },
          },
          tooltip: {
            callbacks: {
              label(context) {
                const value = context.parsed.y;
                const totalMinutes = Math.round(value * 60);
                const h = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
                const m = totalMinutes % 60;
                return `${context.dataset.label}: ${pad2(h)}:${pad2(m)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#9ca3af",
              autoSkip: true,
              maxTicksLimit: 10,
            },
            grid: {
              color: "rgba(148, 163, 184, 0.2)",
            },
          },
          y: {
            min: 0,
            max: 24,
            ticks: {
              stepSize: 2,
              color: "#9ca3af",
              callback(value) {
                const totalMinutes = value * 60;
                const h = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
                const m = totalMinutes % 60;
                return `${pad2(h)}:${pad2(m)}`;
              },
            },
            grid: {
              color: "rgba(148, 163, 184, 0.18)",
            },
          },
        },
      },
    });

    return chartInstance;
  }

  function updateStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("status-message--error", isError);
  }

  async function handleUpdate() {
    try {
      updateButton.disabled = true;
      updateStatus("Computing yearly time series…");

      const { year, baseTimeZone, hh, mm, targets } = collectParams();
      if (!baseTimeZone || targets.length === 0) {
        updateStatus("Please select a base timezone and at least one target.", true);
        return;
      }

      const utcId = "Etc/UTC";
      const allSeriesIds = targets.includes(utcId)
        ? targets
        : [...targets, utcId];

      // Persist settings
      saveSettings({
        year,
        baseTimeZone,
        time: `${pad2(hh)}:${pad2(mm)}`,
        targets,
      });

      const canvas = document.getElementById("timezoneChart");
      const ctx = canvas.getContext("2d");
      const chart = ensureChart(ctx);

      const { labels, datasets } = generateYearlySeries({
        year,
        baseTimeZone,
        hh,
        mm,
        targets: allSeriesIds,
      });

      const palette = [
        "#38bdf8",
        "#a855f7",
        "#22c55e",
        "#f97316",
        "#eab308",
        "#f472b6",
        "#2dd4bf",
        "#60a5fa",
        "#facc15",
        "#c4b5fd",
      ];

      const tzMetaById = new Map(
        (Array.isArray(window.TIMEZONES) ? window.TIMEZONES : []).map((tz) => [
          tz.id,
          tz,
        ])
      );

      function datasetLabelForId(id) {
        if (id === utcId) return "UTC baseline";
        const meta = tzMetaById.get(id);
        return meta?.label || id;
      }

      chart.data.labels = labels;
      chart.data.datasets = datasets.map((ds, index) => {
        const isUtc = ds.label === utcId;
        return {
          label: datasetLabelForId(ds.label),
          data: ds.data,
          borderColor: isUtc ? "#9ca3af" : palette[index % palette.length],
          borderDash: isUtc ? [6, 4] : undefined,
          backgroundColor: "transparent",
          borderWidth: isUtc ? 1.5 : 2,
          tension: 0.15,
          pointRadius: 0,
          pointHitRadius: 6,
        };
      });

      chart.update();
      updateStatus("Chart updated.");
    } catch (err) {
      console.error(err);
      updateStatus("Failed to compute or render chart. See console for details.", true);
    } finally {
      updateButton.disabled = false;
    }
  }

  updateButton.addEventListener("click", handleUpdate);

  shareButton.addEventListener("click", async function () {
    const params = collectParams();
    const shareUrl = encodeConfigToUrl(params);

    try {
      await navigator.clipboard.writeText(shareUrl);
      updateStatus("Link copied to clipboard!");
    } catch {
      prompt("Copy this link:", shareUrl);
    }
  });

  // Initial render
  handleUpdate();
}

document.addEventListener("DOMContentLoaded", () => {
  initControls();
  // Chart initialization and update logic is implemented below.
});

