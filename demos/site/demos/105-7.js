const stages = [
  { id: "source", number: "01", label: "C source", note: "Human-readable intent" },
  { id: "assembly", number: "02", label: "Assembly", note: "ISA instructions" },
  { id: "encoding", number: "03", label: "Machine code", note: "Encoded bytes" },
  { id: "run", number: "04", label: "Run", note: "Observable result" },
];

const examples = {
  add: { title: "Integer addition", concept: "Arithmetic" },
  absolute: { title: "Absolute value", concept: "Conditional move" },
  sum3: { title: "Array sum", concept: "Memory addressing" },
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
    <article class="demo-page architecture-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.7 · Compiler explorer</p>
          <h1>CPU architectures</h1>
          <p class="lede">Compile one C function for <strong>32-bit x86</strong>, <strong>x86-64</strong>, or <strong>Arm64 RISC</strong>, then connect source code to assembly, encoded bytes, and its result.</p>
        </div>
        <div class="concept-key" aria-label="Concept key">
          <span class="chip algorithm">ISA</span>
          <span class="chip encoding">Registers</span>
          <span class="chip data">Machine code</span>
        </div>
      </header>

      <section class="experiment-card x86-lab">
        <div class="x86-control-deck">
          <fieldset>
            <legend>Example</legend>
            <div class="x86-example-switch">
              ${Object.entries(examples).map(([id, example]) => `
                <button type="button" data-example="${id}" aria-pressed="${id === "add"}">
                  <strong>${example.title}</strong><small>${example.concept}</small>
                </button>
              `).join("")}
            </div>
          </fieldset>
          <fieldset>
            <legend>Target architecture</legend>
            <div class="x86-segmented" id="architecture-switch">
              <button type="button" data-architecture="i386" aria-pressed="false"><strong>x86</strong><small>32-bit · i386</small></button>
              <button type="button" data-architecture="x86_64" aria-pressed="true"><strong>x86-64</strong><small>64-bit · AMD64</small></button>
              <button type="button" data-architecture="arm64" aria-pressed="false"><strong>Arm64</strong><small>64-bit · RISC</small></button>
            </div>
          </fieldset>
          <fieldset>
            <legend>Optimization</legend>
            <div class="x86-segmented compact" id="optimization-switch">
              <button type="button" data-optimization="O0" aria-pressed="false"><strong>-O0</strong><small>Direct</small></button>
              <button type="button" data-optimization="O2" aria-pressed="true"><strong>-O2</strong><small>Optimized</small></button>
            </div>
          </fieldset>
        </div>

        <div class="x86-pipeline" role="tablist" aria-label="Compilation stages">
          ${stages.map((stage, index) => `
            <button type="button" role="tab" data-stage="${stage.id}" aria-selected="${index === 0}">
              <span>${stage.number}</span><strong>${stage.label}</strong><small>${stage.note}</small>
            </button>
          `).join("")}
        </div>

        <div class="x86-command-bar">
          <div><span class="x86-prompt">$</span><code id="compiler-command">Preparing compiler command…</code></div>
          <span class="x86-captured"><i></i> Captured compiler output</span>
        </div>

        <div class="x86-workspace" data-active-stage="source">
          <section class="x86-source-panel">
            <header><div><span>INPUT</span><h2>example.c</h2></div><small>C source</small></header>
            <pre><code id="x86-source-code">Loading…</code></pre>
            <div class="x86-inputs" id="x86-inputs" aria-label="Function inputs"></div>
          </section>

          <section class="x86-output-panel" aria-live="polite">
            <header>
              <div><span>OUTPUT</span><h2 id="object-format">Object file</h2></div>
              <div class="x86-metrics"><span><strong id="instruction-count">—</strong> instructions</span><span><strong id="byte-count">—</strong> bytes</span></div>
            </header>
            <div class="x86-column-head"><span>Offset</span><span>Encoded bytes</span><span>Assembly</span></div>
            <div class="x86-instructions" id="x86-instructions"></div>
            <div class="x86-instruction-detail" id="x86-instruction-detail">
              Select an instruction to connect its mnemonic to its operation.
            </div>
          </section>
        </div>

        <div class="x86-runtime">
          <div class="x86-register-note"><span id="architecture-label">x86-64</span><p id="register-note"></p></div>
          <div class="x86-terminal">
            <header><span>PROGRAM OUTPUT</span><i></i><i></i><i></i></header>
            <code><span id="function-call"></span><br><strong id="runtime-output"></strong></code>
          </div>
        </div>

        <div class="experiment-controls x86-controls">
          <button class="button subtle" id="previous-x86-stage" type="button">← Previous step</button>
          <button class="button primary" id="compile-x86" type="button">Play steps</button>
          <button class="button subtle" id="next-x86-stage" type="button">Next step →</button>
        </div>
      </section>

      <section class="x86-principles" aria-label="CPU architecture principles">
        <article><span>ISA</span><h3>The contract</h3><p>An instruction set architecture defines the programmable interface a CPU implements—not one particular processor design.</p></article>
        <article><span>1–15 / 4 B</span><h3>Encoding differs</h3><p>x86 instructions vary from 1–15 bytes, while every AArch64 instruction is one fixed 4-byte word.</p></article>
        <article><span>32 → 64</span><h3>Extension, not replacement</h3><p>x86-64 extends the x86 family with wider registers and addressing while retaining extensive compatibility.</p></article>
        <article><span>CISC ≠ speed</span><h3>Measure, do not assume</h3><p>The CISC or RISC label alone does not determine a program's speed, size, or efficiency.</p></article>
      </section>
      <p class="x86-scope-note"><strong>Model limits:</strong> Disassembly is genuine Apple clang 21.0.0 output captured with frame-pointer omission. Padding between functions is omitted. Runtime results are evaluated from the same C function semantics; the captured object files are not executed by this lab.</p>
    </article>
  `;

  const elements = {
    exampleButtons: [...root.querySelectorAll("[data-example]")],
    architectureButtons: [...root.querySelectorAll("[data-architecture]")],
    optimizationButtons: [...root.querySelectorAll("[data-optimization]")],
    stageButtons: [...root.querySelectorAll("[data-stage]")],
    workspace: root.querySelector(".x86-workspace"),
    command: root.querySelector("#compiler-command"),
    source: root.querySelector("#x86-source-code"),
    inputs: root.querySelector("#x86-inputs"),
    format: root.querySelector("#object-format"),
    instructionCount: root.querySelector("#instruction-count"),
    byteCount: root.querySelector("#byte-count"),
    instructions: root.querySelector("#x86-instructions"),
    detail: root.querySelector("#x86-instruction-detail"),
    architectureLabel: root.querySelector("#architecture-label"),
    registerNote: root.querySelector("#register-note"),
    functionCall: root.querySelector("#function-call"),
    runtimeOutput: root.querySelector("#runtime-output"),
    previous: root.querySelector("#previous-x86-stage"),
    compile: root.querySelector("#compile-x86"),
    next: root.querySelector("#next-x86-stage"),
  };

  let state = { example: "add", architecture: "x86_64", optimization: "O2", inputs: null, stage: 0 };
  let result = null;
  let controller = null;
  let playTimer = null;
  let disposed = false;

  function stopPlaying() {
    if (playTimer) window.clearInterval(playTimer);
    playTimer = null;
    elements.compile.textContent = "Play steps";
  }

  function selectStage(index) {
    state.stage = Math.max(0, Math.min(stages.length - 1, index));
    const stage = stages[state.stage];
    elements.workspace.dataset.activeStage = stage.id;
    elements.stageButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === state.stage;
      button.classList.toggle("active", active);
      button.classList.toggle("complete", buttonIndex < state.stage);
      button.setAttribute("aria-selected", String(active));
    });
    elements.previous.disabled = state.stage === 0;
    elements.next.disabled = state.stage === stages.length - 1;
  }

  function renderInputs(data) {
    elements.inputs.innerHTML = data.example.labels.map((label, index) => `
      <label><span>${escapeHtml(label)}</span><input type="number" min="-999" max="999" step="1" value="${data.example.inputs[index]}" data-input-index="${index}"></label>
    `).join("");
    [...elements.inputs.querySelectorAll("input")].forEach((input) => {
      input.addEventListener("input", () => {
        const values = [...elements.inputs.querySelectorAll("input")].map((field) => Number(field.value));
        state.inputs = values;
        fetchCompilation(false);
      });
    });
  }

  function selectInstruction(index) {
    if (!result) return;
    const instruction = result.instructions[index];
    [...elements.instructions.querySelectorAll("button")].forEach((button, buttonIndex) => {
      button.classList.toggle("selected", buttonIndex === index);
      button.setAttribute("aria-pressed", String(buttonIndex === index));
    });
    elements.detail.innerHTML = `<code>${escapeHtml(instruction.assembly.split(/\s+/)[0])}</code><p>${escapeHtml(instruction.explanation)}</p>`;
  }

  function render(data, rebuildInputs) {
    result = data;
    elements.command.textContent = data.compiler.command;
    elements.source.textContent = data.example.source;
    elements.format.textContent = data.compiler.format;
    elements.instructionCount.textContent = data.metrics.instruction_count;
    elements.byteCount.textContent = data.metrics.byte_count;
    elements.architectureLabel.textContent = data.architecture.label;
    elements.registerNote.textContent = data.architecture.register_note;
    elements.functionCall.textContent = `> ${data.result.call}`;
    elements.runtimeOutput.textContent = data.result.stdout;
    elements.instructions.innerHTML = data.instructions.map((instruction, index) => `
      <button type="button" aria-pressed="false" data-instruction="${index}">
        <span>${escapeHtml(instruction.offset)}</span>
        <code>${escapeHtml(instruction.bytes)}</code>
        <strong>${escapeHtml(instruction.assembly)}</strong>
      </button>
    `).join("");
    [...elements.instructions.querySelectorAll("button")].forEach((button) => {
      button.addEventListener("click", () => selectInstruction(Number(button.dataset.instruction)));
    });
    selectInstruction(0);
    if (rebuildInputs) renderInputs(data);
  }

  async function fetchCompilation(rebuildInputs = true) {
    controller?.abort();
    controller = new AbortController();
    elements.compile.disabled = true;
    elements.compile.textContent = "Compiling…";
    try {
      const response = await fetch("/api/105-7/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          example: state.example,
          architecture: state.architecture,
          optimization: state.optimization,
          inputs: state.inputs,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Compilation request failed.");
      if (!disposed) render(data, rebuildInputs);
    } catch (error) {
      if (error.name !== "AbortError" && !disposed) {
        elements.detail.textContent = error.message;
      }
    } finally {
      if (!disposed) {
        elements.compile.disabled = false;
        if (!playTimer) elements.compile.textContent = "Play steps";
      }
    }
  }

  function updatePressed(buttons, key, value) {
    buttons.forEach((button) => {
      const active = button.dataset[key] === value;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  elements.exampleButtons.forEach((button) => button.addEventListener("click", () => {
    stopPlaying();
    state.example = button.dataset.example;
    state.inputs = null;
    updatePressed(elements.exampleButtons, "example", state.example);
    fetchCompilation(true);
  }));
  elements.architectureButtons.forEach((button) => button.addEventListener("click", () => {
    stopPlaying();
    state.architecture = button.dataset.architecture;
    updatePressed(elements.architectureButtons, "architecture", state.architecture);
    fetchCompilation(false);
  }));
  elements.optimizationButtons.forEach((button) => button.addEventListener("click", () => {
    stopPlaying();
    state.optimization = button.dataset.optimization;
    updatePressed(elements.optimizationButtons, "optimization", state.optimization);
    fetchCompilation(false);
  }));
  elements.stageButtons.forEach((button, index) => button.addEventListener("click", () => {
    stopPlaying();
    selectStage(index);
  }));
  elements.previous.addEventListener("click", () => {
    stopPlaying();
    selectStage(state.stage - 1);
  });
  elements.next.addEventListener("click", () => {
    stopPlaying();
    selectStage(state.stage + 1);
  });
  elements.compile.addEventListener("click", () => {
    if (playTimer) {
      stopPlaying();
      return;
    }
    selectStage(0);
    elements.compile.textContent = "Pause steps";
    playTimer = window.setInterval(() => {
      if (state.stage === stages.length - 1) {
        stopPlaying();
      } else {
        selectStage(state.stage + 1);
        if (state.stage === stages.length - 1) stopPlaying();
      }
    }, 1450);
  });

  updatePressed(elements.exampleButtons, "example", state.example);
  updatePressed(elements.architectureButtons, "architecture", state.architecture);
  updatePressed(elements.optimizationButtons, "optimization", state.optimization);
  selectStage(0);
  await fetchCompilation(true);

  root.addEventListener("lab:pause", stopPlaying);

  return () => {
    root.removeEventListener("lab:pause", stopPlaying);
    disposed = true;
    stopPlaying();
    controller?.abort();
  };
}
