import { readDiagramPalette } from "../diagram-palette.js";

const stages = [
  {
    short: "Structure",
    title: "Data exists as a structured object",
    kind: "data",
    summary: "The program holds named fields with distinct value types: strings, numbers, booleans, arrays, and null.",
  },
  {
    short: "Serialize",
    title: "Serialize the structure as JSON",
    kind: "serialization",
    summary: "A serialization algorithm writes the structure and its values into JSON text with a defined syntax.",
  },
  {
    short: "Encode",
    title: "Encode the JSON text as UTF-8 bytes",
    kind: "encoding",
    summary: "UTF-8 maps the JSON characters to bytes suitable for storage or transmission. This encoding step is separate from serialization.",
  },
  {
    short: "Deserialize",
    title: "Deserialize and reconstruct the object",
    kind: "deserialization",
    summary: "A JSON parser reads the text and rebuilds a new data structure with the same values and JSON data types.",
  },
];

export async function mount(root) {
  let palette = readDiagramPalette(root);
  root.innerHTML = `
    <article class="demo-page serialization-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.4 · Interactive</p>
          <h1>Data Serialization</h1>
          <p class="lede">Watch a structured record become a portable representation, travel as bytes, and return as a new—but equivalent—data structure.</p>
        </div>
        <div class="concept-key" aria-label="Representation key">
          <span class="chip data">Data structure</span>
          <span class="chip serialization">JSON text</span>
          <span class="chip encoding">UTF-8 bytes</span>
        </div>
      </header>

      <section class="experiment-card serialization-lab">
        <form class="record-editor" id="record-editor">
          <label>
            <span>Name <small>string</small></span>
            <input id="record-name" type="text" value="Avery" maxlength="40" />
          </label>
          <label>
            <span>Clearance <small>number</small></span>
            <input id="record-clearance" type="number" value="3" min="0" max="99" />
          </label>
          <label class="boolean-field">
            <span>Active <small>boolean</small></span>
            <span class="switch-wrap"><input id="record-active" type="checkbox" checked /><i aria-hidden="true"></i><b id="active-label">true</b></span>
          </label>
          <label>
            <span>Roles <small>array</small></span>
            <input id="record-roles" type="text" value="analyst, operator" maxlength="80" />
          </label>
          <label>
            <span>Note <small>null when blank</small></span>
            <input id="record-note" type="text" value="" placeholder="No note" maxlength="80" />
          </label>
        </form>

        <div class="serialization-stage-tabs" role="tablist" aria-label="Serialization stages">
          ${stages.map((stage, index) => `
            <button role="tab" data-stage="${index}" aria-selected="${index === 0}">
              <span>${String(index + 1).padStart(2, "0")}</span>${stage.short}
            </button>
          `).join("")}
        </div>

        <div class="serialization-canvas-wrap">
          <canvas id="serialization-canvas" aria-hidden="true"></canvas>
          <div class="serialization-canvas-labels" aria-hidden="true">
            <span>In memory</span><span>Portable representation</span><span>Reconstructed</span>
          </div>
        </div>

        <div class="serialization-workspace">
          <section class="serialization-panel" data-panel="0">
            <header><span>Original object</span><strong>Typed values</strong></header>
            <div class="object-tree" id="original-object"></div>
          </section>
          <section class="serialization-panel wire-panel" data-panel="1">
            <header><span>Serialized form</span><strong id="json-meta">JSON text</strong></header>
            <pre id="serialized-json" tabindex="0"></pre>
            <div class="byte-ribbon" id="serialized-bytes" aria-label="UTF-8 byte representation"></div>
          </section>
          <section class="serialization-panel" data-panel="2">
            <header><span>Reconstructed object</span><strong id="round-trip-status">Waiting</strong></header>
            <div class="object-tree" id="restored-object"></div>
          </section>
        </div>

        <div class="serialization-detail">
          <div>
            <span id="serialization-kind" class="chip data">Data</span>
            <h2 id="serialization-title"></h2>
            <p id="serialization-summary" aria-live="polite" aria-atomic="true"></p>
          </div>
          <div class="serialization-metrics" id="serialization-metrics"></div>
        </div>

        <div class="experiment-controls">
          <button class="button subtle" id="previous-serialization-stage" type="button">← Previous step</button>
          <button class="button primary" id="play-serialization" type="button">Play steps</button>
          <button class="button subtle" id="next-serialization-stage" type="button">Next step →</button>
        </div>
      </section>

      <section class="serialization-notes" aria-label="Serialization distinctions">
        <article>
          <span>01</span>
          <div><h3>Serialization preserves structure</h3><p>JSON records field names, nesting, order within arrays, values, and JSON-compatible data types.</p></div>
        </article>
        <article>
          <span>02</span>
          <div><h3>Encoding produces bytes</h3><p>JSON is text. UTF-8 is one encoding that maps that text to the bytes a file or network connection can carry.</p></div>
        </article>
      </section>
    </article>
  `;

  const elements = {
    form: root.querySelector("#record-editor"),
    name: root.querySelector("#record-name"),
    clearance: root.querySelector("#record-clearance"),
    active: root.querySelector("#record-active"),
    activeLabel: root.querySelector("#active-label"),
    roles: root.querySelector("#record-roles"),
    note: root.querySelector("#record-note"),
    stages: [...root.querySelectorAll(".serialization-stage-tabs button")],
    panels: [...root.querySelectorAll(".serialization-panel")],
    canvas: root.querySelector("#serialization-canvas"),
    original: root.querySelector("#original-object"),
    restored: root.querySelector("#restored-object"),
    json: root.querySelector("#serialized-json"),
    jsonMeta: root.querySelector("#json-meta"),
    bytes: root.querySelector("#serialized-bytes"),
    roundTripStatus: root.querySelector("#round-trip-status"),
    kind: root.querySelector("#serialization-kind"),
    title: root.querySelector("#serialization-title"),
    summary: root.querySelector("#serialization-summary"),
    metrics: root.querySelector("#serialization-metrics"),
    previous: root.querySelector("#previous-serialization-stage"),
    play: root.querySelector("#play-serialization"),
    next: root.querySelector("#next-serialization-stage"),
  };

  let roundTrip = null;
  let currentStage = 0;
  let playTimer = null;
  let fetchTimer = null;
  let animationFrame = null;
  let animationStart = performance.now();
  let requestNumber = 0;
  let disposed = false;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function displayValue(value, type) {
    if (type === "string") return `“${escapeHtml(value)}”`;
    if (type === "array") return `[${value.map((item) => `“${escapeHtml(item)}”`).join(", ")}]`;
    if (type === "null") return "null";
    return escapeHtml(value);
  }

  function objectTree(record) {
    return Object.entries(record).map(([key, value]) => {
      const type = roundTrip.types[key];
      return `
        <div class="object-field ${type}">
          <span class="field-key">${escapeHtml(key)}</span>
          <span class="field-value">${displayValue(value, type)}</span>
          <small>${type}</small>
        </div>
      `;
    }).join("");
  }

  function renderRoundTrip() {
    if (!roundTrip) return;
    elements.original.innerHTML = objectTree(roundTrip.original);
    elements.restored.innerHTML = objectTree(roundTrip.restored);
    elements.json.textContent = roundTrip.pretty;
    elements.jsonMeta.textContent = `${roundTrip.metrics.json_characters} characters`;
    elements.roundTripStatus.textContent = roundTrip.metrics.exact ? "Exact match" : "Different result";

    const visibleBytes = roundTrip.utf8.hex.slice(0, 72);
    elements.bytes.innerHTML = visibleBytes
      .map((byte, index) => `<span title="Byte ${index + 1}">${byte}</span>`)
      .join("");
    if (roundTrip.utf8.hex.length > visibleBytes.length) {
      elements.bytes.insertAdjacentHTML(
        "beforeend",
        `<b>+${roundTrip.utf8.hex.length - visibleBytes.length} more</b>`,
      );
    }

    const metrics = [
      ["Fields", roundTrip.metrics.fields],
      ["JSON text", `${roundTrip.metrics.json_characters} chars`],
      ["UTF-8", `${roundTrip.metrics.utf8_bytes} bytes`],
      ["Round trip", roundTrip.metrics.exact ? "Exact" : "Changed"],
    ];
    elements.metrics.innerHTML = metrics
      .map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`)
      .join("");
    setStage(currentStage);
  }

  function setStage(index) {
    currentStage = Math.max(0, Math.min(stages.length - 1, index));
    const stage = stages[currentStage];
    elements.stages.forEach((button, buttonIndex) => {
      const active = buttonIndex === currentStage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    elements.panels.forEach((panel, panelIndex) => {
      const activationStage = panelIndex === 2 ? 3 : panelIndex;
      panel.classList.toggle("active", activationStage === currentStage);
      panel.classList.toggle("complete", activationStage < currentStage);
      panel.classList.toggle("future", activationStage > currentStage);
    });
    elements.kind.className = `chip ${stage.kind}`;
    elements.kind.textContent = stage.kind[0].toUpperCase() + stage.kind.slice(1);
    elements.title.textContent = stage.title;
    elements.summary.textContent = stage.summary;
    elements.bytes.classList.toggle("revealed", currentStage >= 2);
    elements.previous.disabled = currentStage === 0;
    elements.next.disabled = currentStage === stages.length - 1;
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
    if (currentStage === stages.length - 1) setStage(0);
    elements.play.textContent = "Pause steps";
    playTimer = window.setInterval(() => {
      if (currentStage === stages.length - 1) {
        stopPlaying();
      } else {
        setStage(currentStage + 1);
      }
    }, 1750);
  }

  function recordFromForm() {
    const clearance = Number(elements.clearance.value);
    if (!Number.isFinite(clearance)) throw new Error("Clearance must be a number.");
    return {
      name: elements.name.value,
      clearance,
      active: elements.active.checked,
      roles: elements.roles.value.split(",").map((role) => role.trim()).filter(Boolean),
      note: elements.note.value.trim() || null,
    };
  }

  async function updateRoundTrip() {
    const thisRequest = ++requestNumber;
    elements.activeLabel.textContent = String(elements.active.checked);
    try {
      const response = await fetch("/api/105-4/serialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record: recordFromForm() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Server returned ${response.status}`);
      if (disposed || thisRequest !== requestNumber) return;
      roundTrip = payload;
      renderRoundTrip();
    } catch (error) {
      if (disposed || thisRequest !== requestNumber) return;
      elements.summary.textContent = error.message;
    }
  }

  function scheduleUpdate() {
    window.clearTimeout(fetchTimer);
    fetchTimer = window.setTimeout(updateRoundTrip, 160);
  }

  function drawSerialization(timestamp) {
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

    const sourceX = width * 0.15;
    const wireX = width * 0.5;
    const restoredX = width * 0.85;
    const centerY = height * 0.52;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elapsed = timestamp - animationStart;
    const types = roundTrip ? Object.values(roundTrip.types) : ["string", "number", "boolean", "array", "null"];

    drawSerializationPath(ctx, sourceX + 45, wireX - 48, centerY, currentStage >= 1 ? 0.55 : 0.12);
    drawSerializationPath(ctx, wireX + 48, restoredX - 45, centerY, currentStage >= 3 ? 0.55 : 0.12);
    drawObjectOrbit(ctx, sourceX, centerY, types, currentStage === 0 ? 1 : 0.7);
    drawJsonCore(ctx, wireX, centerY, currentStage >= 1 ? 1 : 0.18, currentStage >= 2);
    drawObjectOrbit(ctx, restoredX, centerY, types, currentStage >= 3 ? 1 : 0.16);

    if (currentStage >= 1) drawSerializationParticles(ctx, sourceX + 45, wireX - 48, centerY, elapsed, reducedMotion, false);
    if (currentStage >= 3) drawSerializationParticles(ctx, wireX + 48, restoredX - 45, centerY, elapsed + 400, reducedMotion, true);

    animationFrame = window.requestAnimationFrame(drawSerialization);
  }

  function typeColor(type) {
    return {
      string: palette.teal,
      number: palette.amber,
      boolean: palette.blue,
      array: palette.violet,
      null: palette.danger,
    }[type] || palette.muted;
  }

  function drawObjectOrbit(ctx, x, y, types, alpha) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = palette.alpha("muted", 0.2 * alpha);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.stroke();
    types.forEach((type, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / types.length;
      const nodeX = x + Math.cos(angle) * 46;
      const nodeY = y + Math.sin(angle) * 46;
      ctx.fillStyle = typeColor(type);
      ctx.shadowColor = typeColor(type);
      ctx.shadowBlur = !palette.light && alpha > 0.5 ? 12 : 0;
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = palette.alpha("ink", 0.92);
    ctx.font = "700 20px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("{ }", x, y + 7);
    ctx.globalAlpha = 1;
  }

  function drawJsonCore(ctx, x, y, alpha, showBytes) {
    ctx.globalAlpha = alpha;
    const gradient = ctx.createLinearGradient(x - 42, y, x + 42, y);
    gradient.addColorStop(0, palette.violet);
    gradient.addColorStop(1, palette.blue);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 43, y - 48, 86, 96, 12);
    ctx.stroke();
    ctx.fillStyle = palette.alpha("violet", 0.08);
    ctx.fill();
    ctx.fillStyle = palette.ink;
    ctx.font = "700 12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("JSON", x, y - 7);
    ctx.fillStyle = showBytes ? palette.blue : palette.faint;
    ctx.font = "600 8px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(showBytes ? "7B 22 6E…" : "TEXT", x, y + 14);
    ctx.globalAlpha = 1;
  }

  function drawSerializationPath(ctx, startX, endX, y, alpha) {
    ctx.strokeStyle = palette.alpha("teal", alpha);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.bezierCurveTo(startX + 45, y - 35, endX - 45, y + 35, endX, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSerializationParticles(ctx, startX, endX, y, elapsed, reducedMotion, reverse) {
    for (let index = 0; index < 5; index += 1) {
      const amount = reducedMotion ? 0.5 : ((elapsed / 1450) + index * 0.19) % 1;
      const inverse = 1 - amount;
      const control = (endX - startX) * 0.45;
      const x = inverse ** 3 * startX + 3 * inverse ** 2 * amount * (startX + control) + 3 * inverse * amount ** 2 * (endX - control) + amount ** 3 * endX;
      const particleY = inverse ** 3 * y + 3 * inverse ** 2 * amount * (y - 35) + 3 * inverse * amount ** 2 * (y + 35) + amount ** 3 * y;
      ctx.globalAlpha = 0.25 + Math.sin(amount * Math.PI) * 0.75;
      ctx.fillStyle = reverse ? palette.teal : palette.violet;
      ctx.beginPath();
      ctx.arc(x, particleY, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  elements.stages.forEach((button) => button.addEventListener("click", () => {
    stopPlaying();
    setStage(Number(button.dataset.stage));
  }));
  elements.previous.addEventListener("click", () => {
    stopPlaying();
    setStage(currentStage - 1);
  });
  elements.next.addEventListener("click", () => {
    stopPlaying();
    setStage(currentStage + 1);
  });
  elements.play.addEventListener("click", togglePlaying);
  elements.form.addEventListener("input", scheduleUpdate);

  setStage(0);
  await updateRoundTrip();
  animationFrame = window.requestAnimationFrame(drawSerialization);

  root.addEventListener("lab:pause", stopPlaying);

  return () => {
    root.removeEventListener("lab:pause", stopPlaying);
    disposed = true;
    stopPlaying();
    window.clearTimeout(fetchTimer);
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  };
}
