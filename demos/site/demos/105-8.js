const scenarioMeta = {
  file: { icon: "FILE", title: "Read a file", short: "Filesystem + storage" },
  launch: { icon: "EXEC", title: "Launch a program", short: "Process + memory" },
  signal: { icon: "SIG", title: "Press Ctrl+C", short: "Asynchronous signal" },
  network: { icon: "NET", title: "Receive a packet", short: "Driver + protocol stack" },
};

const layerMeta = {
  user: { label: "User space", code: "RING 3", description: "Shells, utilities, and applications" },
  boundary: { label: "System-call gate", code: "CONTROLLED", description: "Validated entry and return path" },
  kernel: { label: "Kernel space", code: "RING 0", description: "Privileged resource management" },
  device: { label: "Hardware", code: "I/O", description: "Storage, network, and terminal devices" },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function mount(root) {
  root.innerHTML = `
    <article class="demo-page os-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.8 · OS control room</p>
          <h1>Between an App and the Hardware</h1>
          <p class="lede">Trace a request across the privilege boundary, then map a process's virtual pages under changing memory pressure.</p>
        </div>
        <div class="concept-key" aria-label="Concept key">
          <span class="chip algorithm">Kernel</span>
          <span class="chip encoding">Virtual memory</span>
          <span class="chip data">System calls</span>
        </div>
      </header>

      <div class="os-mode-switch" role="tablist" aria-label="Operating system experiments">
        <button type="button" role="tab" data-os-mode="trace" aria-selected="true">
          <span>01</span><div><strong>Kernel request trace</strong><small>Follow one operation across the OS</small></div>
        </button>
        <button type="button" role="tab" data-os-mode="memory" aria-selected="false">
          <span>02</span><div><strong>Virtual memory mapper</strong><small>Change frames, pages, and pressure</small></div>
        </button>
      </div>

      <section class="experiment-card os-trace-lab" data-os-panel="trace">
        <div class="os-scenario-bar">
          <div class="os-scenario-switch" role="tablist" aria-label="Operating system request scenarios">
            ${Object.entries(scenarioMeta).map(([id, scenario], index) => `
              <button type="button" role="tab" data-os-scenario="${id}" aria-selected="${index === 0}">
                <span>${scenario.icon}</span><div><strong>${scenario.title}</strong><small>${scenario.short}</small></div>
              </button>
            `).join("")}
          </div>
          <button class="os-access-toggle" id="os-access-toggle" type="button" aria-pressed="false">
            <span>ACCESS CHECK</span><strong>Simulate permission denial</strong>
          </button>
        </div>

        <div class="os-request-heading">
          <div><span id="os-command">cat report.txt</span><h2 id="os-trace-question">How does a shell command become bytes on the display?</h2></div>
          <div class="os-outcome" id="os-outcome"><i></i><span><small>Outcome</small><strong>File displayed</strong></span></div>
        </div>

        <div class="os-layer-board" id="os-layer-board">
          ${Object.entries(layerMeta).map(([id, layer]) => `
            <section class="os-layer" data-layer="${id}">
              <header><span>${layer.code}</span><strong>${layer.label}</strong></header>
              <div class="os-layer-content"><small>${layer.description}</small></div>
            </section>
          `).join("")}
          <div class="os-request-token" id="os-request-token" aria-hidden="true">REQ</div>
        </div>

        <div class="os-step-strip" id="os-step-strip" role="tablist" aria-label="Request trace stages"></div>

        <div class="os-trace-detail">
          <section class="os-current-step" aria-live="polite">
            <span id="os-step-counter">Step 1</span>
            <h2 id="os-step-component">Command interpreter</h2>
            <p id="os-step-action"></p>
            <div class="os-state-readout"><small>System state</small><strong id="os-step-state"></strong></div>
          </section>
          <section class="os-syscall-trace">
            <header><div><span>REPRESENTATIVE TRACE</span><h2>System-call output</h2></div><small>Linux-style notation</small></header>
            <pre id="os-trace-output"></pre>
            <p id="os-trace-note"></p>
          </section>
        </div>

        <div class="experiment-controls os-trace-controls">
          <button class="button subtle" id="previous-os-step" type="button" disabled>← Previous step</button>
          <button class="button primary" id="play-os-trace" type="button" disabled>Play steps</button>
          <button class="button subtle" id="next-os-step" type="button" disabled>Next step →</button>
        </div>
      </section>

      <section class="experiment-card os-memory-lab" data-os-panel="memory" hidden>
        <div class="os-memory-controls">
          <label>
            <span><strong>Memory pressure</strong><b id="pressure-output">35%</b></span>
            <input id="memory-pressure" type="range" min="0" max="100" value="35" step="1">
            <small>Higher pressure leaves fewer physical frames available to this process.</small>
          </label>
          <label>
            <span><strong>Active working set</strong><b id="working-set-output">5 pages</b></span>
            <input id="working-set" type="range" min="2" max="7" value="5" step="1">
            <small>Pages the process repeatedly needs during this interval.</small>
          </label>
          <div class="os-memory-health stable" id="os-memory-health">
            <span>MEMORY HEALTH</span><strong>Stable working set</strong><small>Most references avoid page faults.</small>
          </div>
        </div>

        <div class="os-memory-metrics" aria-label="Memory metrics">
          <span><small>Available frames</small><strong id="frame-count">—</strong></span>
          <span><small>Resident pages</small><strong id="resident-count">—</strong></span>
          <span><small>Swap-backed pages</small><strong id="swap-count">—</strong></span>
          <span><small>Faults / 1,000 refs</small><strong id="fault-count">—</strong></span>
        </div>

        <div class="os-memory-map" role="table" aria-label="Virtual-to-physical memory mappings">
          <header role="row">
            <div role="columnheader"><span>PROCESS VIEW</span><strong>Virtual address space</strong></div>
            <div role="columnheader"><span>MMU + PAGE TABLE</span><strong>Address translation</strong></div>
            <div role="columnheader"><span>SYSTEM VIEW</span><strong>Physical or backing store</strong></div>
          </header>
          <div class="os-page-rows" id="os-page-rows" role="rowgroup"></div>
        </div>

        <div class="os-memory-analysis">
          <section><span id="memory-analysis-label">Stable working set</span><h2>What the operating system is doing</h2><p id="memory-analysis-text"></p></section>
          <div class="os-frame-bank"><span>PHYSICAL FRAME AVAILABILITY</span><div id="os-frame-bank"></div></div>
        </div>

        <div class="os-memory-notes">
          <article><span>PAGING</span><p id="paging-note"></p></article>
          <article><span>SWAPPING</span><p id="swapping-note"></p></article>
          <article><span>MODEL SCOPE</span><p id="memory-scope-note"></p></article>
        </div>
      </section>

      <section class="os-principles" aria-label="Operating system principles">
        <article><span>PRIVILEGE</span><h3>The kernel controls access</h3><p>Applications request privileged services through controlled system-call interfaces.</p></article>
        <article><span>ISOLATION</span><h3>Each process gets a view</h3><p>Virtual address spaces separate processes while the MMU translates their addresses.</p></article>
        <article><span>COORDINATION</span><h3>Waiting is not running</h3><p>The scheduler moves processes among ready, running, and waiting states as events occur.</p></article>
        <article><span>ABSTRACTION</span><h3>One interface, varied hardware</h3><p>Drivers and filesystems give programs consistent interfaces to different devices.</p></article>
      </section>
    </article>
  `;

  const elements = {
    modeButtons: [...root.querySelectorAll("[data-os-mode]")],
    panels: [...root.querySelectorAll("[data-os-panel]")],
    scenarioButtons: [...root.querySelectorAll("[data-os-scenario]")],
    access: root.querySelector("#os-access-toggle"),
    command: root.querySelector("#os-command"),
    question: root.querySelector("#os-trace-question"),
    outcome: root.querySelector("#os-outcome"),
    board: root.querySelector("#os-layer-board"),
    layers: [...root.querySelectorAll(".os-layer")],
    token: root.querySelector("#os-request-token"),
    stepStrip: root.querySelector("#os-step-strip"),
    stepCounter: root.querySelector("#os-step-counter"),
    stepComponent: root.querySelector("#os-step-component"),
    stepAction: root.querySelector("#os-step-action"),
    stepState: root.querySelector("#os-step-state"),
    traceOutput: root.querySelector("#os-trace-output"),
    traceNote: root.querySelector("#os-trace-note"),
    previous: root.querySelector("#previous-os-step"),
    play: root.querySelector("#play-os-trace"),
    next: root.querySelector("#next-os-step"),
    pressure: root.querySelector("#memory-pressure"),
    pressureOutput: root.querySelector("#pressure-output"),
    workingSet: root.querySelector("#working-set"),
    workingSetOutput: root.querySelector("#working-set-output"),
    memoryHealth: root.querySelector("#os-memory-health"),
    frameCount: root.querySelector("#frame-count"),
    residentCount: root.querySelector("#resident-count"),
    swapCount: root.querySelector("#swap-count"),
    faultCount: root.querySelector("#fault-count"),
    pageRows: root.querySelector("#os-page-rows"),
    analysisLabel: root.querySelector("#memory-analysis-label"),
    analysisText: root.querySelector("#memory-analysis-text"),
    frameBank: root.querySelector("#os-frame-bank"),
    pagingNote: root.querySelector("#paging-note"),
    swappingNote: root.querySelector("#swapping-note"),
    memoryScopeNote: root.querySelector("#memory-scope-note"),
  };

  let mode = "trace";
  let scenario = "file";
  let accessGranted = true;
  let traceData = null;
  let currentStep = 0;
  let traceController = null;
  let memoryController = null;
  let memoryDebounce = null;
  let playTimer = null;
  let disposed = false;

  function stopTrace() {
    if (playTimer) window.clearInterval(playTimer);
    playTimer = null;
    elements.play.textContent = "Play steps";
  }

  function setMode(nextMode) {
    mode = nextMode;
    stopTrace();
    elements.modeButtons.forEach((button) => {
      const active = button.dataset.osMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    elements.panels.forEach((panel) => { panel.hidden = panel.dataset.osPanel !== mode; });
  }

  function layerPosition(layer) {
    return { user: "12.5%", boundary: "37.5%", kernel: "62.5%", device: "87.5%" }[layer];
  }

  function renderStep(index) {
    if (!traceData) return;
    currentStep = Math.max(0, Math.min(traceData.steps.length - 1, index));
    const step = traceData.steps[currentStep];
    [...elements.stepStrip.querySelectorAll("button")].forEach((button, buttonIndex) => {
      const active = buttonIndex === currentStep;
      button.classList.toggle("active", active);
      button.classList.toggle("complete", buttonIndex < currentStep);
      button.setAttribute("aria-selected", String(active));
    });
    elements.layers.forEach((layer) => {
      const active = layer.dataset.layer === step.layer;
      layer.classList.toggle("active", active);
      const content = layer.querySelector(".os-layer-content");
      if (active) {
        content.innerHTML = `<span>${escapeHtml(step.component)}</span><strong>${escapeHtml(step.state)}</strong>`;
      } else {
        content.innerHTML = `<small>${escapeHtml(layerMeta[layer.dataset.layer].description)}</small>`;
      }
    });
    elements.token.style.left = layerPosition(step.layer);
    elements.token.textContent = step.layer === "device" ? "IRQ" : step.layer === "boundary" ? "SYS" : "REQ";
    elements.stepCounter.textContent = `Step ${currentStep + 1} of ${traceData.steps.length} · ${layerMeta[step.layer].label}`;
    elements.stepComponent.textContent = step.component;
    elements.stepAction.textContent = step.action;
    elements.stepState.textContent = step.state;
    elements.previous.disabled = currentStep === 0;
    elements.next.disabled = currentStep === traceData.steps.length - 1;
  }

  function renderTrace(data) {
    traceData = data;
    currentStep = 0;
    elements.command.textContent = data.scenario.command;
    elements.question.textContent = data.scenario.question;
    elements.outcome.className = `os-outcome ${data.outcome.status}`;
    elements.outcome.innerHTML = `<i></i><span><small>Outcome</small><strong>${escapeHtml(data.outcome.label)}</strong></span>`;
    elements.traceOutput.innerHTML = data.trace.map((line, index) => `<code><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(line)}</code>`).join("");
    elements.traceNote.textContent = data.trace_note;
    elements.play.disabled = false;
    elements.stepStrip.innerHTML = data.steps.map((step, index) => `
      <button type="button" role="tab" data-step="${index}" aria-selected="${index === 0}">
        <span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(step.component)}</strong>
      </button>
    `).join("");
    [...elements.stepStrip.querySelectorAll("button")].forEach((button) => button.addEventListener("click", () => {
      stopTrace();
      renderStep(Number(button.dataset.step));
    }));
    renderStep(0);
  }

  async function fetchTrace() {
    traceData = null;
    stopTrace();
    elements.previous.disabled = true;
    elements.play.disabled = true;
    elements.next.disabled = true;
    elements.stepAction.textContent = "Loading request trace…";
    traceController?.abort();
    traceController = new AbortController();
    try {
      const response = await fetch("/api/105-8/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, access_granted: accessGranted }),
        signal: traceController.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to build request trace.");
      if (!disposed) renderTrace(data);
    } catch (error) {
      if (error.name !== "AbortError" && !disposed) elements.stepAction.textContent = error.message;
    }
  }

  function renderMemory(data) {
    const metrics = data.metrics;
    elements.pressureOutput.textContent = `${data.inputs.memory_pressure}%`;
    elements.workingSetOutput.textContent = `${data.inputs.working_set_pages} pages`;
    elements.frameCount.textContent = metrics.physical_frames;
    elements.residentCount.textContent = metrics.resident_pages;
    elements.swapCount.textContent = metrics.swap_pages;
    elements.faultCount.textContent = metrics.estimated_faults_per_1000;
    elements.memoryHealth.className = `os-memory-health ${data.result.thrashing ? "thrashing" : metrics.working_set_pages > metrics.physical_frames ? "pressure" : "stable"}`;
    elements.memoryHealth.innerHTML = `<span>MEMORY HEALTH</span><strong>${escapeHtml(data.result.health)}</strong><small>${data.result.thrashing ? "Faults dominate useful work." : metrics.working_set_pages > metrics.physical_frames ? "Some active pages are absent." : "Most references avoid page faults."}</small>`;
    elements.analysisLabel.textContent = data.result.health;
    elements.analysisText.textContent = data.result.explanation;
    elements.pageRows.innerHTML = data.mappings.map((mapping) => `
      <article class="os-page-row ${mapping.status} ${mapping.active ? "active" : ""}" role="row">
        <div class="os-virtual-page" role="cell"><span>${escapeHtml(mapping.page)}</span><strong>${escapeHtml(mapping.region)}</strong><small>${escapeHtml(mapping.address)}</small></div>
        <div class="os-page-table-entry" role="cell"><i></i><span>${mapping.active ? "Working set" : "Inactive"}</span><b>${mapping.status === "resident" ? "PRESENT = 1" : "PRESENT = 0"}</b></div>
        <div class="os-page-destination" role="cell"><span>${escapeHtml(mapping.destination)}</span><small>${mapping.status === "resident" ? "Physical RAM" : mapping.status === "swap" ? "Anonymous page backing" : mapping.status === "file" ? "Load on demand" : "Access would fault"}</small></div>
      </article>
    `).join("");
    elements.frameBank.innerHTML = Array.from({ length: 7 }, (_, index) => `<i class="${metrics.available_frame_ids.includes(index) ? "available" : "unavailable"}"><span>F${index}</span></i>`).join("");
    elements.pagingNote.textContent = data.notes.paging;
    elements.swappingNote.textContent = data.notes.swapping;
    elements.memoryScopeNote.textContent = data.notes.scope;
  }

  async function fetchMemory() {
    memoryController?.abort();
    memoryController = new AbortController();
    try {
      const response = await fetch("/api/105-8/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memory_pressure: Number(elements.pressure.value),
          working_set_pages: Number(elements.workingSet.value),
        }),
        signal: memoryController.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to build memory map.");
      if (!disposed) renderMemory(data);
    } catch (error) {
      if (error.name !== "AbortError" && !disposed) elements.analysisText.textContent = error.message;
    }
  }

  function scheduleMemory() {
    elements.pressureOutput.textContent = `${elements.pressure.value}%`;
    elements.workingSetOutput.textContent = `${elements.workingSet.value} pages`;
    if (memoryDebounce) window.clearTimeout(memoryDebounce);
    memoryDebounce = window.setTimeout(fetchMemory, 80);
  }

  elements.modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.osMode)));
  elements.scenarioButtons.forEach((button) => button.addEventListener("click", () => {
    stopTrace();
    scenario = button.dataset.osScenario;
    elements.scenarioButtons.forEach((candidate) => {
      const active = candidate.dataset.osScenario === scenario;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-selected", String(active));
    });
    elements.access.disabled = scenario !== "file";
    elements.access.classList.toggle("unavailable", scenario !== "file");
    fetchTrace();
  }));
  elements.access.addEventListener("click", () => {
    stopTrace();
    accessGranted = !accessGranted;
    elements.access.classList.toggle("denied", !accessGranted);
    elements.access.setAttribute("aria-pressed", String(!accessGranted));
    fetchTrace();
  });
  elements.previous.addEventListener("click", () => { stopTrace(); renderStep(currentStep - 1); });
  elements.next.addEventListener("click", () => { stopTrace(); renderStep(currentStep + 1); });
  elements.play.addEventListener("click", () => {
    if (!traceData) return;
    if (playTimer) { stopTrace(); return; }
    if (currentStep === traceData.steps.length - 1) renderStep(0);
    elements.play.textContent = "Pause steps";
    playTimer = window.setInterval(() => {
      if (currentStep >= traceData.steps.length - 1) {
        stopTrace();
      } else {
        renderStep(currentStep + 1);
        if (currentStep === traceData.steps.length - 1) stopTrace();
      }
    }, 1350);
  });
  elements.pressure.addEventListener("input", scheduleMemory);
  elements.workingSet.addEventListener("input", scheduleMemory);

  elements.modeButtons[0].classList.add("active");
  elements.scenarioButtons[0].classList.add("active");
  await Promise.all([fetchTrace(), fetchMemory()]);

  root.addEventListener("lab:pause", stopTrace);

  return () => {
    root.removeEventListener("lab:pause", stopTrace);
    disposed = true;
    stopTrace();
    if (memoryDebounce) window.clearTimeout(memoryDebounce);
    traceController?.abort();
    memoryController?.abort();
  };
}
