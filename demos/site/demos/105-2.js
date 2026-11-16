import { readDiagramPalette } from "../diagram-palette.js";

const SAMPLE_MESSAGE = "Meet at 09:30 — bring the 📷";

const stages = [
  {
    short: "Information",
    label: "Original information",
    kind: "concept",
    summary: "A human-readable idea begins as text entered by Alice.",
  },
  {
    short: "UTF-8",
    label: "Encode as UTF-8",
    kind: "encoding",
    summary: "An encoding algorithm maps each character to one or more bytes.",
  },
  {
    short: "Base64",
    label: "Apply Base64",
    kind: "encoding",
    summary: "Base64 encoding represents those bytes using a text-safe alphabet.",
  },
  {
    short: "MIME",
    label: "Construct a MIME message",
    kind: "protocol",
    summary: "MIME rules label the representation so receiving software knows how to interpret it.",
  },
  {
    short: "SMTP",
    label: "Transfer with SMTP",
    kind: "protocol",
    summary: "SMTP defines the conversation used to move the email between systems.",
  },
  {
    short: "Decode",
    label: "Reverse the transformations",
    kind: "algorithm",
    summary: "Bob's software decodes Base64 and UTF-8 to recover the original information.",
  },
];

export async function mount(root) {
  let palette = readDiagramPalette(root);
  root.innerHTML = `
    <article class="demo-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.2 · Interactive</p>
          <h1>How information becomes a message</h1>
          <p class="lede">Follow one message from Alice to Bob to separate the <strong>algorithm</strong>, <strong>encoding</strong>, and <strong>protocol</strong> roles.</p>
        </div>
        <div class="concept-key" aria-label="Concept key">
          <span class="chip algorithm">Algorithm</span>
          <span class="chip encoding">Encoding</span>
          <span class="chip protocol">Protocol</span>
        </div>
      </header>

      <section class="experiment-card">
        <div class="input-row">
          <label for="message-input">
            <span>Alice's information</span>
            <small id="character-count">0 characters</small>
          </label>
          <textarea id="message-input" maxlength="180" rows="2">${SAMPLE_MESSAGE}</textarea>
        </div>

        <div class="stage-strip" role="tablist" aria-label="Message transformation stages">
          ${stages
            .map(
              (stage, index) => `
                <button class="stage-step" role="tab" data-stage="${index}" aria-selected="${index === 0}">
                  <span class="step-index">${String(index + 1).padStart(2, "0")}</span>
                  <span>${stage.short}</span>
                </button>
              `,
            )
            .join("")}
        </div>

        <div class="canvas-wrap">
          <canvas id="journey-canvas" aria-label="Animated message traveling from Alice to Bob"></canvas>
          <div class="canvas-label alice-label"><strong>Alice</strong><span>Sender</span></div>
          <div class="canvas-label bob-label"><strong>Bob</strong><span>Receiver</span></div>
        </div>

        <div class="stage-detail" aria-live="polite">
          <div class="detail-heading">
            <div>
              <span id="stage-kind" class="chip concept">Concept</span>
              <h2 id="stage-title">Original information</h2>
            </div>
            <span id="stage-counter" class="stage-counter">Step 1 of 6</span>
          </div>
          <p id="stage-summary"></p>
          <pre id="stage-output" tabindex="0"></pre>
          <div id="stage-metrics" class="metrics"></div>
        </div>

        <div class="experiment-controls">
          <button class="button subtle" id="previous-stage" type="button">← Previous step</button>
          <button class="button primary" id="play-stages" type="button">Play steps</button>
          <button class="button subtle" id="next-stage" type="button">Next step →</button>
        </div>
      </section>

      <section class="concept-grid" aria-label="Concept definitions">
        <article>
          <span class="concept-icon algorithm">ƒ(x)</span>
          <h3>Algorithm</h3>
          <p>The precise procedure software follows: encode bytes, construct a message, transmit it, then decode it.</p>
        </article>
        <article>
          <span class="concept-icon encoding">A→01</span>
          <h3>Encoding</h3>
          <p>A chosen representation. Here, UTF-8 maps characters to bytes and Base64 maps bytes to safe text.</p>
        </article>
        <article>
          <span class="concept-icon protocol">⇄</span>
          <h3>Protocol</h3>
          <p>Shared rules and formats. MIME describes the body; SMTP governs the exchange between mail systems.</p>
        </article>
      </section>
    </article>
  `;

  const elements = {
    input: root.querySelector("#message-input"),
    characterCount: root.querySelector("#character-count"),
    stageButtons: [...root.querySelectorAll(".stage-step")],
    kind: root.querySelector("#stage-kind"),
    title: root.querySelector("#stage-title"),
    counter: root.querySelector("#stage-counter"),
    summary: root.querySelector("#stage-summary"),
    output: root.querySelector("#stage-output"),
    metrics: root.querySelector("#stage-metrics"),
    previous: root.querySelector("#previous-stage"),
    play: root.querySelector("#play-stages"),
    next: root.querySelector("#next-stage"),
    canvas: root.querySelector("#journey-canvas"),
  };

  let pipeline = null;
  let currentStage = 0;
  let playTimer = null;
  let fetchTimer = null;
  let animationFrame = null;
  let animationStart = performance.now();
  let requestController = null;
  let requestRevision = 0;
  let disposed = false;

  function stageOutput(index) {
    if (!pipeline) return "Preparing representation…";
    switch (index) {
      case 0:
        return pipeline.original || "(empty message)";
      case 1:
        return `HEX\n${pipeline.utf8.hex || "—"}\n\nBITS\n${pipeline.utf8.bits || "—"}`;
      case 2:
        return pipeline.base64 || "(empty input produces an empty Base64 value)";
      case 3:
        return pipeline.mime;
      case 4:
        return `C: MAIL FROM:<alice@example.test>\nS: 250 OK\nC: RCPT TO:<bob@example.test>\nS: 250 OK\nC: DATA\nS: 354 Start mail input\nC: [MIME message: ${pipeline.metrics.mime_bytes} bytes]\nS: 250 Message accepted`;
      case 5:
        return `${pipeline.decoded || "(empty message)"}\n\n${pipeline.metrics.round_trip_exact ? "✓ Exact round trip: the recovered text matches Alice's input." : "✕ The recovered text differs."}`;
      default:
        return "";
    }
  }

  function renderMetrics() {
    if (!pipeline) return;
    const values = [
      ["Characters", pipeline.metrics.characters],
      ["UTF-8 bytes", pipeline.metrics.utf8_bytes],
      ["Base64 chars", pipeline.metrics.base64_characters],
      ["With MIME", `${pipeline.metrics.mime_bytes} B`],
    ];
    elements.metrics.innerHTML = values
      .map(([label, value]) => `<span><strong>${value}</strong>${label}</span>`)
      .join("");
  }

  function setStage(index) {
    currentStage = Math.max(0, Math.min(stages.length - 1, index));
    const stage = stages[currentStage];
    elements.stageButtons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === currentStage;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    elements.kind.className = `chip ${stage.kind}`;
    elements.kind.textContent = stage.kind[0].toUpperCase() + stage.kind.slice(1);
    elements.title.textContent = stage.label;
    elements.counter.textContent = `Step ${currentStage + 1} of ${stages.length}`;
    elements.summary.textContent = stage.summary;
    elements.output.textContent = stageOutput(currentStage);
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
    }, 1900);
  }

  async function updatePipeline() {
    const revision = ++requestRevision;
    requestController?.abort();
    requestController = new AbortController();
    const characterCount = [...elements.input.value].length;
    elements.characterCount.textContent = characterCount === 1 ? "1 character" : `${characterCount} characters`;
    try {
      const response = await fetch("/api/105-2/encode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: elements.input.value }),
        signal: requestController.signal,
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const nextPipeline = await response.json();
      if (disposed || revision !== requestRevision || !elements.input.isConnected) return;
      pipeline = nextPipeline;
      renderMetrics();
      setStage(currentStage);
    } catch (error) {
      if (error.name === "AbortError" || disposed || revision !== requestRevision) return;
      elements.output.textContent = "The message couldn’t be processed. Check that the local lab server is running, then edit your message to try again.";
      console.error(error);
    }
  }

  function scheduleUpdate() {
    window.clearTimeout(fetchTimer);
    fetchTimer = window.setTimeout(updatePipeline, 140);
  }

  function drawJourney(timestamp) {
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

    const left = 82;
    const right = width - 82;
    const y = height * 0.52;
    const travel = Math.max(0, Math.min(1, currentStage / (stages.length - 1)));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pulse = reducedMotion ? 0 : Math.sin((timestamp - animationStart) / 250) * 2;

    ctx.lineWidth = 2;
    ctx.strokeStyle = palette.alpha("muted", 0.6);
    ctx.setLineDash([7, 9]);
    ctx.beginPath();
    ctx.moveTo(left + 34, y);
    ctx.lineTo(right - 34, y);
    ctx.stroke();
    ctx.setLineDash([]);

    const completedX = left + 34 + (right - left - 68) * travel;
    const gradient = ctx.createLinearGradient(left, 0, right, 0);
    gradient.addColorStop(0, palette.teal);
    gradient.addColorStop(1, palette.amber);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left + 34, y);
    ctx.lineTo(completedX, y);
    ctx.stroke();

    drawPerson(ctx, left, y, palette.teal);
    drawPerson(ctx, right, y, palette.amber);

    const packetX = left + 34 + (right - left - 68) * travel;
    ctx.shadowColor = palette.alpha("teal", 0.5);
    ctx.shadowBlur = palette.light ? 0 : 18;
    ctx.fillStyle = palette.teal;
    roundRect(ctx, packetX - 33, y - 20 + pulse, 66, 40, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = palette.onAccent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(packetX - 25, y - 11 + pulse);
    ctx.lineTo(packetX, y + 6 + pulse);
    ctx.lineTo(packetX + 25, y - 11 + pulse);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = palette.alpha("ink", 0.72);
    ctx.fillText(stages[currentStage].short.toUpperCase(), packetX, y - 34 + pulse);

    animationFrame = window.requestAnimationFrame(drawJourney);
  }

  function drawPerson(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 16, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `${color}33`;
    ctx.beginPath();
    ctx.arc(x, y + 22, 27, Math.PI, 0);
    ctx.fill();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }

  elements.stageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      stopPlaying();
      setStage(Number(button.dataset.stage));
    });
  });
  elements.previous.addEventListener("click", () => {
    stopPlaying();
    setStage(currentStage - 1);
  });
  elements.next.addEventListener("click", () => {
    stopPlaying();
    setStage(currentStage + 1);
  });
  elements.play.addEventListener("click", togglePlaying);
  elements.input.addEventListener("input", scheduleUpdate);

  setStage(0);
  await updatePipeline();
  animationFrame = window.requestAnimationFrame(drawJourney);

  root.addEventListener("lab:pause", stopPlaying);

  return () => {
    root.removeEventListener("lab:pause", stopPlaying);
    disposed = true;
    stopPlaying();
    window.clearTimeout(fetchTimer);
    requestController?.abort();
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  };
}
