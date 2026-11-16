import { readDiagramPalette } from "../diagram-palette.js";

const components = {
  input: {
    family: "Input / Output",
    title: "Input",
    symbol: "IN",
    purpose: "Brings data and commands into the computer.",
    detail: "Input devices convert actions or signals into data the computer can receive and process.",
    examples: ["Keyboard", "Mouse", "Camera", "Microphone"],
    retention: "Moves data",
  },
  processor: {
    family: "Processor",
    title: "Processor",
    symbol: "CPU",
    purpose: "Executes program instructions.",
    detail: "The processor performs arithmetic, logic, control, and data-transfer operations. Modern processors commonly contain multiple cores and layers of cache.",
    examples: ["CPU cores", "Control unit", "Arithmetic and logic", "Cache"],
    retention: "Computes",
  },
  memory: {
    family: "Memory",
    title: "Memory",
    symbol: "RAM",
    purpose: "Provides fast working space for active programs and data.",
    detail: "Main memory is usually RAM. It is normally volatile, so its contents are lost when power is removed.",
    examples: ["Active programs", "Open documents", "Working data", "RAM modules"],
    retention: "Volatile",
  },
  storage: {
    family: "Storage",
    title: "Storage",
    symbol: "SSD",
    purpose: "Retains programs and data across power cycles.",
    detail: "Storage is non-volatile and designed for longer-term retention. It is typically slower than RAM but offers much greater capacity.",
    examples: ["SSD", "Hard drive", "Magnetic tape", "Optical media"],
    retention: "Non-volatile",
  },
  output: {
    family: "Input / Output",
    title: "Output",
    symbol: "OUT",
    purpose: "Presents processed information outside the computer.",
    detail: "Output devices convert computer data into a form people or other systems can perceive or use.",
    examples: ["Display", "Speaker", "Printer", "Network interface"],
    retention: "Moves data",
  },
};

const scenarios = {
  message: {
    label: "Write a message",
    payload: "TXT",
    summary: "A short document moves from a key press to an active workspace, a result on screen, and finally a saved file.",
    steps: [
      { component: "input", route: ["input"], action: "The keyboard captures a key press as input data." },
      { component: "processor", route: ["input", "processor"], action: "The processor receives the input and executes the editor's instructions." },
      { component: "memory", route: ["processor", "memory"], action: "RAM holds the editor and unfinished message while you work." },
      { component: "output", route: ["memory", "processor", "output"], action: "The processor reads the working data from RAM and sends the result to the display." },
      { component: "storage", route: ["memory", "processor", "storage"], action: "The processor writes the working document from RAM to non-volatile storage." },
    ],
  },
  photo: {
    label: "Open a photo",
    payload: "IMG",
    summary: "A saved image is requested, loaded into working memory, processed, and presented on the display.",
    steps: [
      { component: "input", route: ["input"], action: "A mouse click asks the computer to open the photo." },
      { component: "processor", route: ["input", "processor"], action: "The processor receives the request and directs the next operation." },
      { component: "storage", route: ["processor", "storage"], action: "The processor requests the saved image from storage." },
      { component: "memory", route: ["storage", "processor", "memory"], action: "The image is transferred into RAM as active working data." },
      { component: "output", route: ["memory", "processor", "output"], action: "The processor prepares the image from RAM and sends pixels to the display." },
    ],
  },
  audio: {
    label: "Play audio",
    payload: "WAV",
    summary: "Audio data is loaded, buffered, decoded, and sent to an output device as sound.",
    steps: [
      { component: "input", route: ["input"], action: "A play command enters as the user's requested action." },
      { component: "processor", route: ["input", "processor"], action: "The processor receives the command and requests the audio data." },
      { component: "storage", route: ["processor", "storage"], action: "Storage supplies the saved audio data." },
      { component: "memory", route: ["storage", "processor", "memory"], action: "Audio data is transferred into a buffer in RAM." },
      { component: "output", route: ["memory", "processor", "output"], action: "The processor decodes buffered audio and sends the result to the speakers." },
    ],
  },
};

export async function mount(root) {
  let palette = readDiagramPalette(root);
  root.innerHTML = `
    <article class="demo-page components-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.6 · Interactive overview</p>
          <h1>Basic Computer Components</h1>
          <p class="lede">Trace a simple task through the components that move, process, hold, preserve, and present data.</p>
        </div>
        <div class="concept-key" aria-label="Component key">
          <span class="chip data">I/O</span>
          <span class="chip algorithm">Processor</span>
          <span class="chip encoding">Memory</span>
          <span class="chip serialization">Storage</span>
        </div>
      </header>

      <section class="experiment-card components-lab">
        <div class="scenario-bar">
          <div><span>Example task</span><strong id="scenario-summary"></strong></div>
          <div class="scenario-switch" role="tablist" aria-label="Computer task scenarios">
            ${Object.entries(scenarios).map(([key, scenario], index) => `
              <button role="tab" data-scenario="${key}" aria-selected="${index === 0}">${scenario.label}</button>
            `).join("")}
          </div>
        </div>

        <div class="computer-board" id="computer-board">
          <canvas id="components-canvas" aria-hidden="true"></canvas>
          ${Object.entries(components).map(([key, component]) => `
            <button class="component-node ${key}" type="button" data-component="${key}" aria-label="Explore ${component.title}">
              <span>${component.symbol}</span>
              <strong>${component.title}</strong>
              <small>${component.purpose}</small>
            </button>
          `).join("")}
          <div class="board-label" aria-hidden="true"><span>Conceptual system bus</span><b id="payload-label">TXT</b></div>
        </div>

        <div class="component-stage-list" id="component-stage-list" role="tablist" aria-label="Task data flow"></div>

        <div class="component-detail">
          <section class="selected-component" aria-live="polite">
            <div class="component-heading">
              <span id="component-symbol">IN</span>
              <div><small id="component-family">Input / Output</small><h2 id="component-title">Input</h2></div>
            </div>
            <p id="component-detail-text"></p>
            <div class="component-properties">
              <span><small>Primary role</small><strong id="component-role"></strong></span>
              <span><small>Examples</small><strong id="component-examples"></strong></span>
            </div>
          </section>
          <section class="current-action">
            <span id="step-counter">Step 1 of 5</span>
            <h2 id="step-title"></h2>
            <p id="step-action"></p>
            <div class="route-readout"><small>Data path</small><strong id="step-route"></strong></div>
            <div class="flow-legend"><i></i>Active data path <b></b>Available connection</div>
          </section>
        </div>

        <div class="experiment-controls">
          <button class="button subtle" id="previous-component-stage" type="button">← Previous step</button>
          <button class="button primary" id="play-components" type="button">Play steps</button>
          <button class="button subtle" id="next-component-stage" type="button">Next step →</button>
        </div>
      </section>

      <section class="component-principles" aria-label="Common component distinctions">
        <article><span>RAM ≠ STORAGE</span><h3>Working data is not automatically saved</h3><p>Data in volatile memory must be written to non-volatile storage to survive power loss.</p></article>
        <article><span>I/O</span><h3>Input and output are directions</h3><p>A network interface or storage device may receive data in one operation and send it in another.</p></article>
        <article><span>PARALLEL WORK</span><h3>The diagram shows one path at a time</h3><p>Real systems overlap many operations and may move data through controllers or direct memory access.</p></article>
      </section>
      <p class="component-scope-note"><strong>Model limits:</strong> This overview emphasizes the main conceptual roles; hardware organization and data paths vary by system.</p>
    </article>
  `;

  const elements = {
    scenarios: [...root.querySelectorAll(".scenario-switch button")],
    scenarioSummary: root.querySelector("#scenario-summary"),
    board: root.querySelector("#computer-board"),
    canvas: root.querySelector("#components-canvas"),
    nodes: [...root.querySelectorAll(".component-node")],
    payload: root.querySelector("#payload-label"),
    stages: root.querySelector("#component-stage-list"),
    symbol: root.querySelector("#component-symbol"),
    family: root.querySelector("#component-family"),
    componentTitle: root.querySelector("#component-title"),
    componentDetail: root.querySelector("#component-detail-text"),
    componentRole: root.querySelector("#component-role"),
    componentExamples: root.querySelector("#component-examples"),
    stepCounter: root.querySelector("#step-counter"),
    stepTitle: root.querySelector("#step-title"),
    stepAction: root.querySelector("#step-action"),
    stepRoute: root.querySelector("#step-route"),
    previous: root.querySelector("#previous-component-stage"),
    play: root.querySelector("#play-components"),
    next: root.querySelector("#next-component-stage"),
  };

  let currentScenario = "message";
  let currentStage = 0;
  let selectedComponent = "input";
  let playTimer = null;
  let animationFrame = null;
  let animationStart = performance.now();
  let disposed = false;

  function renderComponent(key) {
    selectedComponent = key;
    const component = components[key];
    elements.nodes.forEach((node) => node.classList.toggle("selected", node.dataset.component === key));
    elements.symbol.textContent = component.symbol;
    elements.symbol.className = key;
    elements.family.textContent = component.family;
    elements.componentTitle.textContent = component.title;
    elements.componentDetail.textContent = component.detail;
    elements.componentRole.textContent = component.retention;
    elements.componentExamples.textContent = component.examples.join(" · ");
  }

  function renderStageList() {
    const scenario = scenarios[currentScenario];
    elements.stages.innerHTML = scenario.steps.map((step, index) => `
      <button role="tab" data-stage="${index}" aria-selected="${index === currentStage}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${components[step.component].title}</strong>
      </button>
    `).join("");
    [...elements.stages.querySelectorAll("button")].forEach((button) => {
      button.addEventListener("click", () => {
        stopPlaying();
        setStage(Number(button.dataset.stage));
      });
    });
  }

  function setStage(index) {
    const scenario = scenarios[currentScenario];
    currentStage = Math.max(0, Math.min(scenario.steps.length - 1, index));
    const step = scenario.steps[currentStage];
    [...elements.stages.querySelectorAll("button")].forEach((button, buttonIndex) => {
      const active = buttonIndex === currentStage;
      button.classList.toggle("active", active);
      button.classList.toggle("complete", buttonIndex < currentStage);
      button.setAttribute("aria-selected", String(active));
    });
    elements.nodes.forEach((node) => {
      const stageIndex = scenario.steps.findIndex((item) => item.component === node.dataset.component);
      node.classList.toggle("active", node.dataset.component === step.component);
      node.classList.toggle("complete", stageIndex >= 0 && stageIndex < currentStage);
    });
    elements.stepCounter.textContent = `Step ${currentStage + 1} of ${scenario.steps.length}`;
    elements.stepTitle.textContent = components[step.component].title;
    elements.stepAction.textContent = step.action;
    elements.stepRoute.textContent = step.route.map((key) => components[key].title).join(" → ");
    elements.previous.disabled = currentStage === 0;
    elements.next.disabled = currentStage === scenario.steps.length - 1;
    renderComponent(step.component);
    animationStart = performance.now();
  }

  function setScenario(key, autoplay = false) {
    const resumePlayback = Boolean(playTimer);
    currentScenario = key;
    currentStage = 0;
    stopPlaying();
    const scenario = scenarios[key];
    elements.scenarios.forEach((button) => {
      const active = button.dataset.scenario === key;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    elements.scenarioSummary.textContent = scenario.summary;
    elements.payload.textContent = scenario.payload;
    renderStageList();
    setStage(0);
    if (autoplay || resumePlayback) startPlaying();
  }

  function stopPlaying() {
    if (playTimer) window.clearInterval(playTimer);
    playTimer = null;
    elements.play.textContent = "Play steps";
  }

  function startPlaying() {
    const scenario = scenarios[currentScenario];
    if (currentStage === scenario.steps.length - 1) setStage(0);
    if (currentStage === 0 && scenario.steps.length > 1) setStage(1);
    elements.play.textContent = "Pause steps";
    playTimer = window.setInterval(() => {
      if (currentStage === scenarios[currentScenario].steps.length - 1) {
        stopPlaying();
      } else {
        setStage(currentStage + 1);
      }
    }, 1700);
  }

  function togglePlaying() {
    if (playTimer) {
      stopPlaying();
    } else {
      startPlaying();
    }
  }

  function nodeCenters() {
    const boardRect = elements.board.getBoundingClientRect();
    return Object.fromEntries(elements.nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return [node.dataset.component, {
        x: rect.left - boardRect.left + rect.width / 2,
        y: rect.top - boardRect.top + rect.height / 2,
      }];
    }));
  }

  function drawComponents(timestamp) {
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

    const centers = nodeCenters();
    const processor = centers.processor;
    Object.entries(centers).forEach(([key, point]) => {
      if (key === "processor") return;
      drawConnection(ctx, processor, point, palette.alpha("muted", 0.18), 1.2, true);
    });

    const scenario = scenarios[currentScenario];
    for (let index = 1; index <= currentStage; index += 1) {
      const route = scenario.steps[index].route.map((key) => centers[key]);
      for (let segment = 1; segment < route.length; segment += 1) {
        drawConnection(
          ctx,
          route[segment - 1],
          route[segment],
          index === currentStage ? palette.alpha("teal", 0.72) : palette.alpha("teal", 0.3),
          index === currentStage ? 2.4 : 1.5,
          false,
        );
      }
    }

    if (currentStage > 0) {
      const route = scenario.steps[currentStage].route.map((key) => centers[key]);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const amount = reducedMotion ? 0.62 : ((timestamp - animationStart) / 1250) % 1;
      const point = pointAlongRoute(route, amount);
      ctx.fillStyle = palette.teal;
      ctx.shadowColor = palette.teal;
      ctx.shadowBlur = palette.light ? 0 : 16;
      ctx.beginPath();
      ctx.roundRect(point.x - 15, point.y - 10, 30, 20, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = palette.onAccent;
      ctx.font = "800 7px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(scenario.payload, point.x, point.y + 2.5);
    }

    animationFrame = window.requestAnimationFrame(drawComponents);
  }

  function drawConnection(ctx, from, to, color, width, dashed) {
    const horizontal = Math.abs(to.x - from.x) > Math.abs(to.y - from.y);
    const bend = horizontal ? { x: (from.x + to.x) / 2, y: from.y } : { x: from.x, y: (from.y + to.y) / 2 };
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dashed ? [5, 8] : []);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(bend.x, bend.y, to.x, to.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function curvedPoint(from, to, amount) {
    const horizontal = Math.abs(to.x - from.x) > Math.abs(to.y - from.y);
    const control = horizontal ? { x: (from.x + to.x) / 2, y: from.y } : { x: from.x, y: (from.y + to.y) / 2 };
    const inverse = 1 - amount;
    return {
      x: inverse ** 2 * from.x + 2 * inverse * amount * control.x + amount ** 2 * to.x,
      y: inverse ** 2 * from.y + 2 * inverse * amount * control.y + amount ** 2 * to.y,
    };
  }

  function pointAlongRoute(points, amount) {
    if (points.length === 1) return points[0];
    const segmentCount = points.length - 1;
    const scaled = Math.min(amount * segmentCount, segmentCount - Number.EPSILON);
    const segment = Math.floor(scaled);
    return curvedPoint(points[segment], points[segment + 1], scaled - segment);
  }

  elements.scenarios.forEach((button) => button.addEventListener("click", () => setScenario(button.dataset.scenario, true)));
  elements.nodes.forEach((node) => node.addEventListener("click", () => {
    stopPlaying();
    renderComponent(node.dataset.component);
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

  setScenario("message");
  animationFrame = window.requestAnimationFrame(drawComponents);

  root.addEventListener("lab:pause", stopPlaying);

  return () => {
    root.removeEventListener("lab:pause", stopPlaying);
    disposed = true;
    stopPlaying();
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  };
}
