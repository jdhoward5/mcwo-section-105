const models = {
  iaas: {
    name: "Infrastructure as a service",
    short: "IaaS",
    prompt: "You rent virtualized compute, storage, and networking.",
    customer: ["Data", "Applications", "Runtime", "Operating system"],
    provider: ["Virtualization", "Servers", "Storage", "Networking"],
    decision: "You still patch the guest OS and operate everything above it.",
  },
  paas: {
    name: "Platform as a service",
    short: "PaaS",
    prompt: "You deploy code into a provider-managed runtime.",
    customer: ["Data", "Applications"],
    provider: ["Runtime", "Operating system", "Virtualization", "Servers", "Storage", "Networking"],
    decision: "Your team focuses on application code and data; the provider operates the platform.",
  },
  saas: {
    name: "Software as a service",
    short: "SaaS",
    prompt: "You configure and use a complete network-delivered application.",
    customer: ["Configuration & use", "Your data governance"],
    provider: ["Application", "Runtime", "Operating system", "Virtualization", "Servers", "Storage", "Networking"],
    decision: "The provider runs the application and infrastructure; you use and configure the service.",
  },
};

const termNotes = {
  csp: ["Cloud service provider", "The organization operating and delivering shared cloud services under a subscription, usage-based, or other service agreement."],
  iac: ["Infrastructure as code", "Machine-readable configuration makes infrastructure repeatable, reviewable, version-controlled, and automatable."],
  ci: ["Continuous integration", "Changes are merged frequently, then built and tested automatically."],
  cd: ["Continuous delivery / deployment", "Delivery keeps passing changes ready to release. Deployment releases every passing change automatically."],
};

function ensureStyle() {
  if (document.querySelector('link[data-mcwo1116-style]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/demos/105-11-16.css";
  link.dataset.mcwo1116Style = "true";
  document.head.append(link);
}

export async function mount(root) {
  ensureStyle();
  root.innerHTML = `
    <article class="demo-page mcwo1116-page mcwo1116-cloud">
      <header class="demo-header"><div><p class="eyebrow">Module 105.11 · Cloud responsibility lab</p><h1>Cloud and development terms</h1><p class="lede">Switch service models to see which parts the customer manages, then trace an automated change from configuration to release.</p></div></header>
      <section class="mcwo1116-card">
        <div class="mcwo1116-tabs" role="group" aria-label="Cloud service model">
          ${Object.entries(models).map(([id, model], i) => `<button type="button" data-model="${id}" aria-pressed="${i === 0}"><strong>${model.short}</strong><small>${model.name}</small></button>`).join("")}
        </div>
        <div class="mcwo1116-cloud-summary" aria-live="polite"><div><span id="mcwo1116-cloud-code">IaaS</span><h2 id="mcwo1116-cloud-name"></h2><p id="mcwo1116-cloud-prompt"></p></div><p id="mcwo1116-cloud-decision"></p></div>
        <div class="mcwo1116-responsibility">
          <section><header><span>CUSTOMER MANAGES</span><strong id="mcwo1116-customer-count"></strong></header><div id="mcwo1116-customer"></div></section>
          <section><header><span>PROVIDER MANAGES</span><strong id="mcwo1116-provider-count"></strong></header><div id="mcwo1116-provider"></div></section>
        </div>
      </section>
      <section class="mcwo1116-split">
        <div class="mcwo1116-card mcwo1116-terms"><header><span>RELATED TERMS</span><h2>Inspect the operating model</h2></header><div class="mcwo1116-term-grid">${Object.entries(termNotes).map(([id, note], i) => `<button type="button" data-term="${id}" aria-pressed="${i === 0}"><strong>${note[0]}</strong><small>Inspect definition</small></button>`).join("")}</div><div class="mcwo1116-feedback" id="mcwo1116-term-note" aria-live="polite"></div></div>
        <div class="mcwo1116-card mcwo1116-pipeline"><header><span>CI/CD PIPELINE</span><h2>Advance one code change</h2></header><div class="mcwo1116-pipeline-track" id="mcwo1116-pipeline-track"></div><button type="button" class="mcwo1116-action" id="mcwo1116-advance">Advance change</button><p id="mcwo1116-pipeline-note" aria-live="polite"></p></div>
      </section>
    </article>`;

  const aborter = new AbortController();
  const signal = aborter.signal;
  let currentModel = "iaas";
  let pipelineStep = 0;
  const stages = [
    ["Commit", "A developer merges a small change."],
    ["Build", "CI creates a reproducible artifact."],
    ["Test", "CI validates the change automatically."],
    ["Release ready", "Continuous delivery keeps the passing artifact ready for approval."],
    ["Deployed", "Continuous deployment would release it automatically."],
  ];

  function renderModel() {
    const model = models[currentModel];
    root.querySelector("#mcwo1116-cloud-code").textContent = model.short;
    root.querySelector("#mcwo1116-cloud-name").textContent = model.name;
    root.querySelector("#mcwo1116-cloud-prompt").textContent = model.prompt;
    root.querySelector("#mcwo1116-cloud-decision").textContent = model.decision;
    root.querySelector("#mcwo1116-customer-count").textContent = `${model.customer.length} responsibilities`;
    root.querySelector("#mcwo1116-provider-count").textContent = `${model.provider.length} responsibilities`;
    root.querySelector("#mcwo1116-customer").innerHTML = model.customer.map(item => `<span>${item}</span>`).join("");
    root.querySelector("#mcwo1116-provider").innerHTML = model.provider.map(item => `<span>${item}</span>`).join("");
    root.querySelectorAll("[data-model]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.model === currentModel)));
  }

  function renderPipeline() {
    root.querySelector("#mcwo1116-pipeline-track").innerHTML = stages.map((stage, index) => `<span class="${index < pipelineStep ? "done" : index === pipelineStep ? "active" : ""}"><i>${index + 1}</i><strong>${stage[0]}</strong></span>`).join("");
    root.querySelector("#mcwo1116-pipeline-note").textContent = stages[pipelineStep][1];
    root.querySelector("#mcwo1116-advance").textContent = pipelineStep === stages.length - 1 ? "Reset pipeline" : "Advance change";
  }

  root.querySelectorAll("[data-model]").forEach(button => button.addEventListener("click", () => { currentModel = button.dataset.model; renderModel(); }, { signal }));
  root.querySelectorAll("[data-term]").forEach(button => button.addEventListener("click", () => {
    root.querySelectorAll("[data-term]").forEach(candidate => candidate.setAttribute("aria-pressed", String(candidate === button)));
    const note = termNotes[button.dataset.term];
    root.querySelector("#mcwo1116-term-note").innerHTML = `<strong>${note[0]}</strong><p>${note[1]}</p>`;
  }, { signal }));
  root.querySelector("#mcwo1116-advance").addEventListener("click", () => { pipelineStep = pipelineStep === stages.length - 1 ? 0 : pipelineStep + 1; renderPipeline(); }, { signal });

  renderModel();
  renderPipeline();
  root.querySelector('[data-term="csp"]').click();
  return () => aborter.abort();
}
