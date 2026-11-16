import { readDiagramPalette } from "../diagram-palette.js";

const DEFAULT_BYTES = "42 42 42 42 43 43 43 82 82 82 83 83 84 130 130 131 131 132";

const phaseNames = ["Source bytes", "Compressed form", "Decompressed bytes"];

export async function mount(root) {
  let palette = readDiagramPalette(root);
  root.innerHTML = `
    <article class="demo-page compression-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.3 · Interactive</p>
          <h1>Compression</h1>
          <p class="lede">Send the same byte stream through two paths. <strong>Lossless</strong> compression preserves every value; <strong>lossy</strong> compression trades precision for a smaller representation.</p>
        </div>
        <div class="mode-switch" role="tablist" aria-label="Compression method">
          <button class="mode-option active" role="tab" data-mode="lossless" aria-selected="true">
            <span>Lossless</span><small>Exact</small>
          </button>
          <button class="mode-option" role="tab" data-mode="lossy" aria-selected="false">
            <span>Lossy</span><small>Approximate</small>
          </button>
        </div>
      </header>

      <section class="experiment-card compression-lab">
        <div class="compression-input-row">
          <label for="byte-input">
            <span>Source byte stream</span>
            <small>Decimal values from 0–255</small>
          </label>
          <input id="byte-input" type="text" value="${DEFAULT_BYTES}" spellcheck="false" autocomplete="off" />
          <label class="quantization-control" for="quantization-step">
            <span>Quantization bucket size</span>
            <select id="quantization-step">
              <option value="4">4-value buckets</option>
              <option value="8">8-value buckets</option>
              <option value="16" selected>16-value buckets</option>
              <option value="32">32-value buckets</option>
              <option value="64">64-value buckets</option>
            </select>
          </label>
          <p class="input-error" id="compression-error" role="alert"></p>
        </div>

        <div class="compression-phase-tabs" role="tablist" aria-label="Compression stages">
          ${phaseNames.map((name, index) => `
            <button role="tab" data-phase="${index}" aria-selected="${index === 0}">
              <span>${String(index + 1).padStart(2, "0")}</span>${name}
            </button>
          `).join("")}
        </div>

        <div class="compression-canvas-wrap">
          <canvas id="compression-canvas" aria-hidden="true"></canvas>
          <div class="compression-canvas-labels" aria-hidden="true">
            <span>Input bytes</span><span>Encoded runs</span><span>Decoded bytes</span>
          </div>
        </div>

        <div class="compression-visuals">
          <section class="stream-panel" data-panel="0">
            <header><span>Input</span><strong id="source-meta">—</strong></header>
            <div class="byte-list" id="source-bytes"></div>
          </section>
          <section class="stream-panel" data-panel="1">
            <header><span id="encoded-heading">RLE runs</span><strong id="encoded-meta">—</strong></header>
            <div class="run-list" id="encoded-runs"></div>
          </section>
          <section class="stream-panel" data-panel="2">
            <header><span>Output</span><strong id="restored-meta">—</strong></header>
            <div class="byte-list" id="restored-bytes"></div>
          </section>
        </div>

        <div class="compression-explanation">
          <div>
            <span id="result-badge" class="result-badge exact">Exact reconstruction</span>
            <h2 id="compression-title">Run-length encoding keeps every byte</h2>
            <p id="compression-summary" aria-live="polite" aria-atomic="true"></p>
          </div>
          <div class="compression-metrics" id="compression-metrics"></div>
        </div>

        <div class="experiment-controls">
          <button class="button subtle" id="previous-compression-stage" type="button">← Previous step</button>
          <button class="button primary" id="play-compression" type="button">Play steps</button>
          <button class="button subtle" id="next-compression-stage" type="button">Next step →</button>
        </div>
      </section>

      <p class="storage-note" id="storage-note"></p>

      <section class="concept-grid compression-concepts" aria-label="Compression concepts">
        <article>
          <span class="concept-icon lossless-icon">=</span>
          <h3>Lossless</h3>
          <p>RLE replaces each repeated run with a count and value. Decompression expands those pairs and recovers the exact input.</p>
        </article>
        <article>
          <span class="concept-icon lossy-icon">≈</span>
          <h3>Lossy</h3>
          <p>Quantization first groups nearby values. RLE may then describe fewer runs, but discarded precision cannot be reconstructed.</p>
        </article>
      </section>
    </article>
  `;

  const elements = {
    modes: [...root.querySelectorAll(".mode-option")],
    phases: [...root.querySelectorAll(".compression-phase-tabs button")],
    panels: [...root.querySelectorAll(".stream-panel")],
    input: root.querySelector("#byte-input"),
    quantization: root.querySelector("#quantization-step"),
    quantizationControl: root.querySelector(".quantization-control"),
    error: root.querySelector("#compression-error"),
    canvas: root.querySelector("#compression-canvas"),
    sourceBytes: root.querySelector("#source-bytes"),
    encodedRuns: root.querySelector("#encoded-runs"),
    restoredBytes: root.querySelector("#restored-bytes"),
    sourceMeta: root.querySelector("#source-meta"),
    encodedHeading: root.querySelector("#encoded-heading"),
    encodedMeta: root.querySelector("#encoded-meta"),
    restoredMeta: root.querySelector("#restored-meta"),
    badge: root.querySelector("#result-badge"),
    title: root.querySelector("#compression-title"),
    summary: root.querySelector("#compression-summary"),
    metrics: root.querySelector("#compression-metrics"),
    storageNote: root.querySelector("#storage-note"),
    previous: root.querySelector("#previous-compression-stage"),
    play: root.querySelector("#play-compression"),
    next: root.querySelector("#next-compression-stage"),
  };

  let comparison = null;
  let currentMode = "lossless";
  let currentPhase = 0;
  let playTimer = null;
  let fetchTimer = null;
  let animationFrame = null;
  let animationStart = performance.now();
  let requestNumber = 0;
  let disposed = false;

  function byteToken(value, index, changedIndices = []) {
    const hue = Math.round(160 + (value / 255) * 110);
    const changed = changedIndices.includes(index);
    return `<span class="byte-token ${changed ? "changed" : ""}" style="--byte-hue:${hue}" title="Byte ${index + 1}: ${value}${changed ? " (changed)" : ""}">${value}</span>`;
  }

  function runToken(run) {
    const hue = Math.round(160 + (run.value / 255) * 110);
    return `
      <span class="run-token" style="--byte-hue:${hue}">
        <strong>${run.count}</strong><span>×</span><b>${run.value}</b>
      </span>
    `;
  }

  function formatReduction(value) {
    if (value === 0) return "No size change";
    if (value > 0) return `${value}% smaller`;
    return `${Math.abs(value)}% larger`;
  }

  function renderComparison() {
    if (!comparison) return;
    const result = comparison[currentMode];
    const metrics = result.metrics;
    const changedIndices = currentMode === "lossy" ? metrics.changed_indices : [];

    elements.sourceBytes.innerHTML = comparison.original
      .map((value, index) => byteToken(value, index))
      .join("");
    elements.encodedRuns.innerHTML = result.runs.map(runToken).join("");
    elements.restoredBytes.innerHTML = result.decoded
      .map((value, index) => byteToken(value, index, changedIndices))
      .join("");

    elements.sourceMeta.textContent = `${metrics.original_bytes} bytes`;
    elements.encodedHeading.textContent = currentMode === "lossless" ? "RLE runs" : "Quantized RLE runs";
    const runLabel = result.runs.length === 1 ? "run" : "runs";
    const changedLabel = metrics.changed_bytes === 1 ? "value changed" : "values changed";
    elements.encodedMeta.textContent = `${result.runs.length} ${runLabel} · ${metrics.encoded_bytes} bytes`;
    elements.restoredMeta.textContent = metrics.exact ? "Exact match" : `${metrics.changed_bytes} ${changedLabel}`;
    elements.storageNote.textContent = comparison.storage_model;

    if (currentMode === "lossless") {
      elements.badge.className = "result-badge exact";
      elements.badge.textContent = "Exact reconstruction";
      elements.title.textContent = "Run-length encoding keeps every byte";
      elements.summary.textContent = "Repeated values become compact count/value pairs. Decompression expands each pair, reproducing the source byte-for-byte.";
    } else {
      elements.badge.className = "result-badge approximate";
      elements.badge.textContent = "Approximate reconstruction";
      elements.title.textContent = "Quantization reduces precision and may reduce the number of runs";
      elements.summary.textContent = `Values are first placed into ${result.quantization_step}-value buckets, discarding some low-order detail. The reconstructed stream is similar, but the highlighted bytes cannot return to their original values.`;
    }

    const metricItems = [
      ["Source", `${metrics.original_bytes} B`],
      ["Compressed", `${metrics.encoded_bytes} B`],
      ["Size result", formatReduction(metrics.reduction_percent)],
      [currentMode === "lossless" ? "Changed" : "Mean error", currentMode === "lossless" ? "0 bytes" : metrics.mean_absolute_error],
    ];
    elements.metrics.innerHTML = metricItems
      .map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`)
      .join("");

    elements.quantizationControl.classList.toggle("available", currentMode === "lossy");
    setPhase(currentPhase);
  }

  function setMode(mode) {
    currentMode = mode;
    elements.modes.forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    currentPhase = 0;
    stopPlaying();
    animationStart = performance.now();
    renderComparison();
  }

  function setPhase(phase) {
    currentPhase = Math.max(0, Math.min(phaseNames.length - 1, phase));
    elements.phases.forEach((button, index) => {
      const active = index === currentPhase;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    elements.panels.forEach((panel, index) => {
      panel.classList.toggle("active", index === currentPhase);
      panel.classList.toggle("complete", index < currentPhase);
      panel.classList.toggle("future", index > currentPhase);
    });
    elements.previous.disabled = currentPhase === 0;
    elements.next.disabled = currentPhase === phaseNames.length - 1;
    animationStart = performance.now();
  }

  function stopPlaying() {
    if (playTimer) window.clearInterval(playTimer);
    playTimer = null;
    elements.play.textContent = "Play steps";
  }

  function togglePlaying() {
    if (playTimer) {
      stopPlaying();
      return;
    }
    if (currentPhase === phaseNames.length - 1) setPhase(0);
    elements.play.textContent = "Pause steps";
    playTimer = window.setInterval(() => {
      if (currentPhase === phaseNames.length - 1) {
        stopPlaying();
      } else {
        setPhase(currentPhase + 1);
      }
    }, 1750);
  }

  function parseBytes() {
    const tokens = elements.input.value.trim().split(/[\s,]+/).filter(Boolean);
    if (!tokens.length) throw new Error("Enter at least one byte value.");
    const values = tokens.map(Number);
    if (values.some((value) => !Number.isInteger(value))) {
      throw new Error("Use whole numbers separated by spaces or commas.");
    }
    return values;
  }

  async function updateComparison() {
    const thisRequest = ++requestNumber;
    try {
      const values = parseBytes();
      const response = await fetch("/api/105-3/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bytes: values,
          quantization_step: Number(elements.quantization.value),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Server returned ${response.status}`);
      if (disposed || thisRequest !== requestNumber) return;
      comparison = payload;
      elements.error.textContent = "";
      renderComparison();
    } catch (error) {
      if (disposed || thisRequest !== requestNumber) return;
      elements.error.textContent = error.message;
    }
  }

  function scheduleUpdate() {
    window.clearTimeout(fetchTimer);
    fetchTimer = window.setTimeout(updateComparison, 180);
  }

  function pointOnCurve(startX, startY, endX, endY, amount) {
    const controlOffset = (endX - startX) * 0.48;
    const inverse = 1 - amount;
    return {
      x: inverse ** 3 * startX + 3 * inverse ** 2 * amount * (startX + controlOffset) + 3 * inverse * amount ** 2 * (endX - controlOffset) + amount ** 3 * endX,
      y: inverse ** 3 * startY + 3 * inverse ** 2 * amount * (startY - 38) + 3 * inverse * amount ** 2 * (endY + 38) + amount ** 3 * endY,
    };
  }

  function drawCompression(timestamp) {
    palette = readDiagramPalette(root);
    if (disposed) return;
    const canvas = elements.canvas;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!comparison) {
      animationFrame = window.requestAnimationFrame(drawCompression);
      return;
    }

    const result = comparison[currentMode];
    const sourceX = width * 0.14;
    const compressedX = width * 0.5;
    const restoredX = width * 0.86;
    const centerY = height * 0.54;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elapsed = timestamp - animationStart;

    drawFlow(ctx, sourceX, compressedX, centerY, currentPhase >= 1 ? 0.48 : 0.1);
    drawFlow(ctx, compressedX, restoredX, centerY, currentPhase >= 2 ? 0.48 : 0.1);
    drawByteCluster(ctx, comparison.original, sourceX, centerY, currentPhase === 0 ? 1 : 0.72, []);
    drawRunCluster(ctx, result.runs, compressedX, centerY, currentPhase >= 1 ? 1 : 0.2);
    drawByteCluster(ctx, result.decoded, restoredX, centerY, currentPhase >= 2 ? 1 : 0.16, result.metrics.changed_indices);

    if (currentPhase >= 1) {
      drawParticles(ctx, sourceX, compressedX, centerY, elapsed, reducedMotion, currentMode);
    }
    if (currentPhase >= 2) {
      drawParticles(ctx, compressedX, restoredX, centerY, elapsed + 500, reducedMotion, currentMode);
    }

    animationFrame = window.requestAnimationFrame(drawCompression);
  }

  function drawFlow(ctx, startX, endX, y, alpha) {
    const gradient = ctx.createLinearGradient(startX, 0, endX, 0);
    gradient.addColorStop(0, palette.alpha("teal", alpha));
    gradient.addColorStop(1, palette.alpha("amber", alpha));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.moveTo(startX + 34, y);
    ctx.bezierCurveTo(startX + 80, y - 38, endX - 80, y + 38, endX - 34, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawByteCluster(ctx, values, x, y, alpha, changedIndices) {
    const count = Math.min(values.length, 24);
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399;
      const radius = 12 + Math.sqrt(index) * 9;
      const pointX = x + Math.cos(angle) * radius;
      const pointY = y + Math.sin(angle) * radius * 0.72;
      const hue = 160 + (values[index] / 255) * 110;
      const changed = changedIndices.includes(index);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = changed ? palette.danger : `hsl(${hue} 68% ${palette.light ? 36 : 62}%)`;
      ctx.shadowColor = changed ? palette.danger : `hsl(${hue} 68% 55%)`;
      ctx.shadowBlur = !palette.light && alpha > 0.5 ? 10 : 0;
      ctx.beginPath();
      ctx.arc(pointX, pointY, 3.5 + (values[index] % 4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function drawRunCluster(ctx, runs, x, y, alpha) {
    runs.slice(0, 14).forEach((run, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const columns = Math.min(runs.length, 2);
      const pointX = x + (column - (columns - 1) / 2) * 24;
      const pointY = y - Math.min(Math.ceil(runs.length / 2), 7) * 10 + row * 22;
      const hue = 160 + (run.value / 255) * 110;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsla(${hue}, 65%, 58%, 0.18)`;
      ctx.strokeStyle = `hsl(${hue} 65% ${palette.light ? 32 : 60}%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pointX - 10, pointY - 8, 20, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = palette.ink;
      ctx.font = "600 7px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${run.count}×`, pointX, pointY + 2.5);
    });
    ctx.globalAlpha = 1;
  }

  function drawParticles(ctx, startX, endX, y, elapsed, reducedMotion, mode) {
    for (let index = 0; index < 4; index += 1) {
      const amount = reducedMotion ? 0.5 : ((elapsed / 1500) + index * 0.23) % 1;
      const point = pointOnCurve(startX + 34, y, endX - 34, y, amount);
      ctx.fillStyle = mode === "lossless" ? palette.teal : palette.orange;
      ctx.globalAlpha = 0.25 + Math.sin(amount * Math.PI) * 0.75;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  elements.modes.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  elements.phases.forEach((button) => button.addEventListener("click", () => {
    stopPlaying();
    setPhase(Number(button.dataset.phase));
  }));
  elements.previous.addEventListener("click", () => {
    stopPlaying();
    setPhase(currentPhase - 1);
  });
  elements.next.addEventListener("click", () => {
    stopPlaying();
    setPhase(currentPhase + 1);
  });
  elements.play.addEventListener("click", togglePlaying);
  elements.input.addEventListener("input", scheduleUpdate);
  elements.quantization.addEventListener("change", updateComparison);

  setPhase(0);
  await updateComparison();
  animationFrame = window.requestAnimationFrame(drawCompression);

  root.addEventListener("lab:pause", stopPlaying);

  return () => {
    root.removeEventListener("lab:pause", stopPlaying);
    disposed = true;
    stopPlaying();
    window.clearTimeout(fetchTimer);
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  };
}
