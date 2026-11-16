import { readDiagramPalette } from "../diagram-palette.js";

const stages = [
  {
    short: "T1 · Send",
    title: "The client timestamps its request",
    summary: "T1 comes from the client's unsynchronized clock, so it includes the client's current clock error.",
  },
  {
    short: "T2 · Receive",
    title: "The time server receives the request",
    summary: "T2 is recorded by the reference clock after the request crosses the outbound network path.",
  },
  {
    short: "T3 · Reply",
    title: "The time server timestamps its response",
    summary: "T3 captures when the response leaves. Comparing T2 and T3 lets NTP remove server processing time.",
  },
  {
    short: "T4 · Receive",
    title: "The client receives the reply and estimates its offset",
    summary: "T4 completes the exchange. The four timestamps estimate delay and clock offset; applying that estimate is a separate step, and a client may step or gradually discipline its clock.",
  },
];

export async function mount(root) {
  let palette = readDiagramPalette(root);
  root.innerHTML = `
    <article class="demo-page ntp-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.5 · Interactive</p>
          <h1>Network Time Protocol</h1>
          <p class="lede">Follow one four-timestamp exchange as a client estimates its clock error against an accurate time source.</p>
        </div>
        <div class="concept-key" aria-label="NTP concept key">
          <span class="chip protocol">NTP exchange</span>
          <span class="chip encoding">4 timestamps</span>
          <span class="chip algorithm">Offset estimate</span>
        </div>
      </header>

      <section class="experiment-card ntp-lab">
        <div class="ntp-controls" id="ntp-controls">
          <label>
            <span>Client clock error <output id="client-error-output">+240 ms</output></span>
            <input id="client-error" type="range" min="-500" max="500" step="10" value="240" />
            <small>Negative is slow; positive is fast</small>
          </label>
          <label>
            <span>Outbound delay <output id="outbound-output">36 ms</output></span>
            <input id="outbound-delay" type="range" min="5" max="200" step="1" value="36" />
            <small>Client → server</small>
          </label>
          <label>
            <span>Server processing <output id="processing-output">4 ms</output></span>
            <input id="server-processing" type="range" min="0" max="25" step="1" value="4" />
            <small>Between T2 and T3</small>
          </label>
          <label>
            <span>Inbound delay <output id="inbound-output">36 ms</output></span>
            <input id="inbound-delay" type="range" min="5" max="200" step="1" value="36" />
            <small>Server → client</small>
          </label>
          <div class="ntp-presets" aria-label="Network presets">
            <button class="preset-button active" type="button" data-preset="balanced" aria-pressed="true">Balanced path</button>
            <button class="preset-button" type="button" data-preset="asymmetric" aria-pressed="false">Asymmetric path</button>
          </div>
        </div>

        <div class="ntp-stage-tabs" role="tablist" aria-label="NTP exchange stages">
          ${stages.map((stage, index) => `
            <button role="tab" data-stage="${index}" aria-selected="${index === 0}">
              <span>${String(index + 1).padStart(2, "0")}</span>${stage.short}
            </button>
          `).join("")}
        </div>

        <div class="ntp-canvas-wrap">
          <canvas id="ntp-canvas" aria-hidden="true"></canvas>
          <div class="clock-readout client-readout">
            <span>Client clock</span>
            <strong id="client-clock-readout">12:00:00.240</strong>
            <small id="client-clock-state">+240 ms fast</small>
          </div>
          <div class="clock-readout server-readout">
            <span>Time source</span>
            <strong>12:00:00.000</strong>
            <small>Reference</small>
          </div>
        </div>

        <div class="timestamp-grid" id="timestamp-grid" aria-live="polite"></div>

        <div class="ntp-analysis">
          <div class="ntp-stage-copy">
            <span class="chip protocol">NTP</span>
            <h2 id="ntp-stage-title"></h2>
            <p id="ntp-stage-summary"></p>
            <div class="sync-result" id="sync-result"></div>
          </div>
          <div class="formula-stack">
            <article>
              <span>Round-trip delay</span>
              <code>δ = (T4 − T1) − (T3 − T2)</code>
              <strong id="delay-result">—</strong>
            </article>
            <article>
              <span>Estimated correction</span>
              <code>θ = [(T2 − T1) + (T3 − T4)] ÷ 2</code>
              <strong id="offset-result">—</strong>
            </article>
          </div>
        </div>

        <div class="experiment-controls">
          <button class="button subtle" id="previous-ntp-stage" type="button">← Previous step</button>
          <button class="button primary" id="play-ntp" type="button">Play steps</button>
          <button class="button subtle" id="next-ntp-stage" type="button">Next step →</button>
        </div>
      </section>

      <section class="ntp-importance" aria-label="Why accurate system time matters">
        <header><p class="eyebrow">Why synchronization matters</p><h2>Shared time creates a trustworthy sequence of events.</h2></header>
        <div>
          <article><span>LOG</span><h3>Comparable logs</h3><p>Correlate activity recorded by different systems.</p></article>
          <article><span>SEQ</span><h3>Event ordering</h3><p>Determine which distributed event happened first.</p></article>
          <article><span>TLS</span><h3>Certificate validity</h3><p>Evaluate not-before and expiration times correctly.</p></article>
          <article><span>AGE</span><h3>Replay defenses</h3><p>Reject messages whose timestamps are stale.</p></article>
        </div>
      </section>
      <p class="ntp-scope-note"><strong>Model limits:</strong> NTP synchronizes a computer's timekeeping clock. It does not synchronize the processor clock that drives instruction execution.</p>
    </article>
  `;

  const elements = {
    controls: root.querySelector("#ntp-controls"),
    clientError: root.querySelector("#client-error"),
    outbound: root.querySelector("#outbound-delay"),
    processing: root.querySelector("#server-processing"),
    inbound: root.querySelector("#inbound-delay"),
    clientErrorOutput: root.querySelector("#client-error-output"),
    outboundOutput: root.querySelector("#outbound-output"),
    processingOutput: root.querySelector("#processing-output"),
    inboundOutput: root.querySelector("#inbound-output"),
    presets: [...root.querySelectorAll(".preset-button")],
    stages: [...root.querySelectorAll(".ntp-stage-tabs button")],
    canvas: root.querySelector("#ntp-canvas"),
    clientClock: root.querySelector("#client-clock-readout"),
    clientClockState: root.querySelector("#client-clock-state"),
    timestamps: root.querySelector("#timestamp-grid"),
    title: root.querySelector("#ntp-stage-title"),
    summary: root.querySelector("#ntp-stage-summary"),
    syncResult: root.querySelector("#sync-result"),
    delayResult: root.querySelector("#delay-result"),
    offsetResult: root.querySelector("#offset-result"),
    previous: root.querySelector("#previous-ntp-stage"),
    play: root.querySelector("#play-ntp"),
    next: root.querySelector("#next-ntp-stage"),
  };

  let simulation = null;
  let currentStage = 0;
  let playTimer = null;
  let fetchTimer = null;
  let animationFrame = null;
  let animationStart = performance.now();
  let requestNumber = 0;
  let disposed = false;

  function signed(value, suffix = " ms") {
    const number = Number(value);
    return `${number > 0 ? "+" : ""}${number}${suffix}`;
  }

  function clockState(value) {
    if (value === 0) return "Exactly aligned";
    return `${signed(value)} ${value > 0 ? "fast" : "slow"}`;
  }

  function updateControlLabels() {
    elements.clientErrorOutput.textContent = signed(elements.clientError.value);
    elements.outboundOutput.textContent = `${elements.outbound.value} ms`;
    elements.processingOutput.textContent = `${elements.processing.value} ms`;
    elements.inboundOutput.textContent = `${elements.inbound.value} ms`;
  }

  function renderSimulation() {
    if (!simulation) return;
    const calculation = simulation.calculation;
    const result = simulation.result;
    const inputs = simulation.inputs;

    elements.timestamps.innerHTML = simulation.timestamps.map((timestamp, index) => `
      <article data-timestamp="${index}">
        <span>${timestamp.id}</span>
        <div><strong>${timestamp.display}</strong><small>${timestamp.label}</small></div>
        <b>${timestamp.clock} clock</b>
      </article>
    `).join("");
    elements.delayResult.textContent = `${calculation.round_trip_delay_ms} ms`;
    elements.offsetResult.textContent = signed(calculation.estimated_correction_ms);
    elements.clientClock.textContent = simulation.timestamps[0].display;
    elements.clientClockState.textContent = currentStage === 3
      ? `Modeled residual: ${clockState(result.after_error_ms)}`
      : clockState(inputs.client_error_ms);

    const exactClass = result.estimate_exact ? "exact" : "biased";
    elements.syncResult.className = `sync-result ${exactClass}`;
    elements.syncResult.innerHTML = `
      <div><small>Before sync</small><strong>${signed(result.before_error_ms)}</strong></div>
      <span aria-hidden="true">→</span>
      <div><small>Modeled residual if applied</small><strong>${signed(result.after_error_ms)}</strong></div>
      <b>${result.quality}</b>
    `;
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
    [...elements.timestamps.children].forEach((card, cardIndex) => {
      card.classList.toggle("active", cardIndex === currentStage);
      card.classList.toggle("complete", cardIndex < currentStage);
      card.classList.toggle("future", cardIndex > currentStage);
    });
    elements.title.textContent = stage.title;
    elements.summary.textContent = stage.summary;
    if (simulation) {
      elements.clientClockState.textContent = currentStage === 3
        ? `Modeled residual: ${clockState(simulation.result.after_error_ms)}`
        : clockState(simulation.inputs.client_error_ms);
    }
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

  async function updateSimulation() {
    const thisRequest = ++requestNumber;
    updateControlLabels();
    try {
      const response = await fetch("/api/105-5/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_error_ms: Number(elements.clientError.value),
          outbound_delay_ms: Number(elements.outbound.value),
          server_processing_ms: Number(elements.processing.value),
          inbound_delay_ms: Number(elements.inbound.value),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Server returned ${response.status}`);
      if (disposed || thisRequest !== requestNumber) return;
      simulation = payload;
      renderSimulation();
    } catch (error) {
      if (disposed || thisRequest !== requestNumber) return;
      elements.summary.textContent = error.message;
    }
  }

  function scheduleUpdate() {
    window.clearTimeout(fetchTimer);
    fetchTimer = window.setTimeout(updateSimulation, 80);
  }

  function applyPreset(name) {
    if (name === "balanced") {
      elements.outbound.value = "36";
      elements.inbound.value = "36";
      elements.processing.value = "4";
    } else {
      elements.outbound.value = "20";
      elements.inbound.value = "100";
      elements.processing.value = "4";
    }
    elements.presets.forEach((button) => {
      const active = button.dataset.preset === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateSimulation();
  }

  function drawNtp(timestamp) {
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

    const clientX = width * 0.18;
    const serverX = width * 0.82;
    const centerY = height * 0.48;
    const elapsed = timestamp - animationStart;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const beforeError = simulation?.result.before_error_ms || 0;
    const afterError = simulation?.result.after_error_ms || 0;
    const clientError = currentStage === 3 ? afterError : beforeError;

    drawClock(ctx, clientX, centerY, clientError, palette.teal, currentStage === 3);
    drawClock(ctx, serverX, centerY, 0, palette.amber, false);
    drawExchangePaths(ctx, clientX, serverX, centerY);
    drawPacket(ctx, clientX, serverX, centerY, elapsed, reducedMotion);

    animationFrame = window.requestAnimationFrame(drawNtp);
  }

  function drawClock(ctx, x, y, error, color, corrected) {
    ctx.strokeStyle = corrected ? color : palette.alpha("muted", 0.32);
    ctx.lineWidth = corrected ? 3 : 2;
    ctx.beginPath();
    ctx.arc(x, y, 52, 0, Math.PI * 2);
    ctx.stroke();
    for (let tick = 0; tick < 12; tick += 1) {
      const angle = -Math.PI / 2 + tick * Math.PI / 6;
      ctx.strokeStyle = tick % 3 === 0 ? color : palette.alpha("muted", 0.35);
      ctx.lineWidth = tick % 3 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 42, y + Math.sin(angle) * 42);
      ctx.lineTo(x + Math.cos(angle) * 47, y + Math.sin(angle) * 47);
      ctx.stroke();
    }
    const angle = -Math.PI / 2 + ((error + 500) / 1000) * Math.PI * 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * 34, y + Math.sin(angle) * 34);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = palette.light ? 0 : 10;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawExchangePaths(ctx, clientX, serverX, y) {
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = currentStage >= 1 ? palette.alpha("teal", 0.5) : palette.alpha("muted", 0.16);
    ctx.beginPath();
    ctx.moveTo(clientX + 58, y - 8);
    ctx.bezierCurveTo(clientX + 150, y - 70, serverX - 150, y - 70, serverX - 58, y - 8);
    ctx.stroke();
    ctx.strokeStyle = currentStage >= 3 ? palette.alpha("amber", 0.55) : palette.alpha("muted", 0.16);
    ctx.beginPath();
    ctx.moveTo(serverX - 58, y + 8);
    ctx.bezierCurveTo(serverX - 150, y + 70, clientX + 150, y + 70, clientX + 58, y + 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function curvePoint(startX, endX, y, amount, upper) {
    const inverse = 1 - amount;
    const bend = upper ? -72 : 72;
    const control = (endX - startX) * 0.33;
    return {
      x: inverse ** 3 * startX + 3 * inverse ** 2 * amount * (startX + control) + 3 * inverse * amount ** 2 * (endX - control) + amount ** 3 * endX,
      y: inverse ** 3 * y + 3 * inverse ** 2 * amount * (y + bend) + 3 * inverse * amount ** 2 * (y + bend) + amount ** 3 * y,
    };
  }

  function drawPacket(ctx, clientX, serverX, y, elapsed, reducedMotion) {
    let point;
    let color = palette.teal;
    if (currentStage === 0) {
      point = { x: clientX + 62, y: y - 8 };
    } else if (currentStage === 1) {
      const amount = reducedMotion ? 0.55 : (elapsed / 1450) % 1;
      point = curvePoint(clientX + 58, serverX - 58, y - 8, amount, true);
    } else if (currentStage === 2) {
      point = { x: serverX - 62, y: y + 8 };
      color = palette.amber;
    } else {
      const amount = reducedMotion ? 0.55 : (elapsed / 1450) % 1;
      point = curvePoint(serverX - 58, clientX + 58, y + 8, amount, false);
      color = palette.amber;
    }
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = palette.light ? 0 : 15;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }

  elements.controls.addEventListener("input", (event) => {
    if (event.target.matches('input[type="range"]')) {
      elements.presets.forEach((button) => {
        button.classList.remove("active");
        button.setAttribute("aria-pressed", "false");
      });
      scheduleUpdate();
    }
  });
  elements.presets.forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.preset)));
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

  setStage(0);
  await updateSimulation();
  animationFrame = window.requestAnimationFrame(drawNtp);

  root.addEventListener("lab:pause", stopPlaying);

  return () => {
    root.removeEventListener("lab:pause", stopPlaying);
    disposed = true;
    stopPlaying();
    window.clearTimeout(fetchTimer);
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  };
}
