const stackMeta = {
  type1: { code: "T1", title: "Type 1", subtitle: "Bare-metal hypervisor" },
  type2: { code: "T2", title: "Type 2", subtitle: "Hosted hypervisor" },
  container: { code: "CTR", title: "Containers", subtitle: "Shared host kernel" },
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
    <article class="demo-page virtualization-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.9 · Virtualization workbench</p>
          <h1>Virtualization</h1>
          <p class="lede">Inspect where the kernel and isolation boundary live, then watch an orchestrator keep container replicas aligned with desired state.</p>
        </div>
        <div class="concept-key" aria-label="Concept key">
          <span class="chip algorithm">Hypervisor</span>
          <span class="chip encoding">Virtual machine</span>
          <span class="chip data">Container</span>
          <span class="chip concept">Orchestrator</span>
        </div>
      </header>

      <div class="virt-mode-switch" role="tablist" aria-label="Virtualization experiments">
        <button type="button" role="tab" data-virt-mode="stack" aria-selected="true"><span>01</span><div><strong>Isolation stack builder</strong><small>Compare hypervisors, VMs, and containers</small></div></button>
        <button type="button" role="tab" data-virt-mode="cluster" aria-selected="false"><span>02</span><div><strong>Container orchestrator</strong><small>Scale, fail, schedule, and recover</small></div></button>
      </div>

      <section class="experiment-card virt-stack-lab" data-virt-panel="stack">
        <div class="virt-stack-switch" role="tablist" aria-label="Isolation stack type">
          ${Object.entries(stackMeta).map(([id, item], index) => `
            <button type="button" role="tab" data-stack-type="${id}" aria-selected="${index === 0}"><span>${item.code}</span><div><strong>${item.title}</strong><small>${item.subtitle}</small></div></button>
          `).join("")}
        </div>

        <div class="virt-stack-heading">
          <div><span id="virt-stack-short">Bare-metal virtualization</span><h2 id="virt-stack-label">Type 1 hypervisor</h2><p id="virt-stack-summary"></p></div>
          <div class="virt-kernel-badge" id="virt-kernel-badge"><span>KERNEL MODEL</span><strong>Separate guest kernel</strong></div>
        </div>

        <div class="virt-stack-workspace">
          <section class="virt-layer-column">
            <header><span>EXECUTION STACK</span><strong>Application → physical resources</strong></header>
            <div class="virt-layers" id="virt-layers" role="list" aria-label="Virtualization layers"></div>
          </section>
          <section class="virt-layer-inspector" aria-live="polite">
            <span id="virt-layer-position">Layer 1</span>
            <h2 id="virt-layer-name">Physical hardware</h2>
            <p id="virt-layer-detail"></p>
            <div class="virt-layer-facts">
              <span><small>Managed by</small><strong id="virt-layer-owner"></strong></span>
              <span><small>Privilege / boundary</small><strong id="virt-layer-privilege"></strong></span>
            </div>
            <div class="virt-boundary-note"><i></i><p id="virt-boundary-copy">Select any layer to inspect its role in the stack.</p></div>
          </section>
        </div>

        <div class="virt-resource-heading"><div><span>RESOURCE INSPECTOR</span><h2 id="virt-resource-title">Inside the virtual machine</h2></div><p>Follow the environment's logical resources back to the physical host.</p></div>
        <div class="virt-resource-grid" id="virt-resource-grid"></div>

        <div class="virt-comparison-strip">
          <span><small>Kernel</small><strong id="comparison-kernel"></strong></span>
          <span><small>Host OS beneath hypervisor</small><strong id="comparison-host"></strong></span>
          <span><small>Isolation unit</small><strong id="comparison-boundary"></strong></span>
          <span><small>Packaged artifact</small><strong id="comparison-artifact"></strong></span>
        </div>
      </section>

      <section class="experiment-card virt-cluster-lab" data-virt-panel="cluster" hidden>
        <div class="virt-cluster-controls">
          <label>
            <span><strong>Desired replicas</strong><b id="replica-output">3</b></span>
            <input id="desired-replicas" type="range" min="1" max="6" value="3" step="1">
            <small>The state the orchestrator continually tries to maintain.</small>
          </label>
          <div class="virt-failure-actions">
            <span>FAILURE INJECTION</span>
            <div><button type="button" id="crash-container">Crash a container</button><button type="button" id="toggle-host-failure">Fail host-2</button><button type="button" id="restore-cluster">Restore all</button></div>
          </div>
          <div class="virt-convergence converged" id="virt-convergence"><span>RECONCILIATION</span><strong>Desired = actual</strong><small>Cluster has converged.</small></div>
        </div>

        <div class="virt-cluster-metrics" aria-label="Cluster metrics">
          <span><small>Desired</small><strong id="cluster-desired">—</strong></span>
          <span><small>Running</small><strong id="cluster-running">—</strong></span>
          <span><small>Pending</small><strong id="cluster-pending">—</strong></span>
          <span><small>Healthy hosts</small><strong id="cluster-hosts">—</strong></span>
        </div>

        <div class="virt-orchestrator-bar"><span>CONTAINER ORCHESTRATOR</span><strong>Observe → compare → schedule → reconcile</strong><div id="orchestrator-pulse"><i></i><i></i><i></i></div></div>
        <div class="virt-host-board" id="virt-host-board"></div>

        <div class="virt-cluster-detail">
          <section class="virt-desired-state">
            <header><span>DESIRED STATE</span><h2>deployment.yaml</h2></header>
            <pre id="virt-config"></pre>
            <p>The orchestrator treats configuration as intent, not a one-time command.</p>
          </section>
          <section class="virt-event-log">
            <header><span>CONTROL LOOP</span><h2>Reconciliation events</h2></header>
            <div id="virt-events" aria-live="polite"></div>
          </section>
          <section class="virt-cluster-output">
            <header><span>CLUSTER VIEW</span><h2>Workload status</h2></header>
            <div class="virt-output-head"><span>Name</span><span>Host</span><span>Status</span></div>
            <div id="virt-output"></div>
          </section>
        </div>
      </section>

      <section class="virt-principles" aria-label="Virtualization principles">
        <article><span>VM</span><h3>A software-defined computer</h3><p>Virtual CPUs, memory, storage, and networking support a complete guest operating system.</p></article>
        <article><span>CONTAINER</span><h3>An isolated host process</h3><p>Applications package dependencies but still make system calls to the shared host kernel.</p></article>
        <article><span>HYPERVISOR</span><h3>The VM resource manager</h3><p>It creates and manages virtual machines while mapping their resources onto a host.</p></article>
        <article><span>ORCHESTRATOR</span><h3>A desired-state control loop</h3><p>It schedules, monitors, scales, networks, and replaces containers across available hosts.</p></article>
      </section>
      <p class="virt-scope-note">The cluster uses small deterministic capacities to make scheduling visible. Real orchestrators consider many more constraints, policies, health signals, and networking details.</p>
    </article>
  `;

  const elements = {
    modeButtons: [...root.querySelectorAll("[data-virt-mode]")],
    panels: [...root.querySelectorAll("[data-virt-panel]")],
    stackButtons: [...root.querySelectorAll("[data-stack-type]")],
    stackShort: root.querySelector("#virt-stack-short"),
    stackLabel: root.querySelector("#virt-stack-label"),
    stackSummary: root.querySelector("#virt-stack-summary"),
    kernelBadge: root.querySelector("#virt-kernel-badge"),
    layers: root.querySelector("#virt-layers"),
    layerPosition: root.querySelector("#virt-layer-position"),
    layerName: root.querySelector("#virt-layer-name"),
    layerDetail: root.querySelector("#virt-layer-detail"),
    layerOwner: root.querySelector("#virt-layer-owner"),
    layerPrivilege: root.querySelector("#virt-layer-privilege"),
    boundaryCopy: root.querySelector("#virt-boundary-copy"),
    resourceTitle: root.querySelector("#virt-resource-title"),
    resourceGrid: root.querySelector("#virt-resource-grid"),
    comparisonKernel: root.querySelector("#comparison-kernel"),
    comparisonHost: root.querySelector("#comparison-host"),
    comparisonBoundary: root.querySelector("#comparison-boundary"),
    comparisonArtifact: root.querySelector("#comparison-artifact"),
    replicas: root.querySelector("#desired-replicas"),
    replicaOutput: root.querySelector("#replica-output"),
    crash: root.querySelector("#crash-container"),
    hostFailure: root.querySelector("#toggle-host-failure"),
    restore: root.querySelector("#restore-cluster"),
    convergence: root.querySelector("#virt-convergence"),
    clusterDesired: root.querySelector("#cluster-desired"),
    clusterRunning: root.querySelector("#cluster-running"),
    clusterPending: root.querySelector("#cluster-pending"),
    clusterHosts: root.querySelector("#cluster-hosts"),
    hostBoard: root.querySelector("#virt-host-board"),
    config: root.querySelector("#virt-config"),
    events: root.querySelector("#virt-events"),
    output: root.querySelector("#virt-output"),
  };

  let mode = "stack";
  let stackType = "type1";
  let stackData = null;
  let selectedLayer = 0;
  let failedHosts = [];
  let crashedReplica = null;
  let stackController = null;
  let clusterController = null;
  let clusterDebounce = null;
  let disposed = false;

  function setMode(nextMode) {
    mode = nextMode;
    elements.modeButtons.forEach((button) => {
      const active = button.dataset.virtMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    elements.panels.forEach((panel) => { panel.hidden = panel.dataset.virtPanel !== mode; });
  }

  function selectLayer(index) {
    if (!stackData) return;
    selectedLayer = Math.max(0, Math.min(stackData.layers.length - 1, index));
    const layer = stackData.layers[selectedLayer];
    [...elements.layers.querySelectorAll("button")].forEach((button) => {
      const active = Number(button.dataset.layerIndex) === selectedLayer;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.layerPosition.textContent = `Layer ${layer.position} of ${stackData.layers.length}`;
    elements.layerName.textContent = layer.label;
    elements.layerDetail.textContent = layer.detail;
    elements.layerOwner.textContent = layer.owner;
    elements.layerPrivilege.textContent = layer.privilege;
    elements.boundaryCopy.textContent = layer.id === "vm" || layer.id === "container"
      ? `This ${layer.id === "vm" ? "virtual machine" : "container"} is the environment's primary isolation boundary.`
      : layer.id === "guest" ? "This kernel is privileged inside the VM, but the hypervisor still controls its virtual hardware."
      : layer.id === "host" && stackType === "container" ? "Every containerized application shown here ultimately uses this same host kernel."
      : "Select adjacent layers to see how control and ownership change through the stack.";
  }

  function renderStack(data) {
    stackData = data;
    selectedLayer = 0;
    elements.stackShort.textContent = data.stack.short;
    elements.stackLabel.textContent = data.stack.label;
    elements.stackSummary.textContent = data.stack.summary;
    elements.kernelBadge.innerHTML = `<span>KERNEL MODEL</span><strong>${escapeHtml(data.comparison.kernel_model)}</strong>`;
    elements.kernelBadge.classList.toggle("shared", data.stack.shared_host_kernel);
    const visualLayers = [...data.layers].reverse();
    elements.layers.innerHTML = visualLayers.map((layer) => {
      const originalIndex = data.layers.findIndex((candidate) => candidate.id === layer.id);
      return `<button type="button" data-layer-index="${originalIndex}" data-layer-id="${layer.id}" aria-pressed="false"><span>${String(layer.position).padStart(2, "0")}</span><strong>${escapeHtml(layer.label)}</strong><small>${escapeHtml(layer.privilege)}</small></button>`;
    }).join("");
    [...elements.layers.querySelectorAll("button")].forEach((button) => button.addEventListener("click", () => selectLayer(Number(button.dataset.layerIndex))));
    elements.resourceTitle.textContent = stackType === "container" ? "Inside the container boundary" : "Inside the virtual machine";
    elements.resourceGrid.innerHTML = data.resources.map((resource) => `
      <article><span>${escapeHtml(resource.id)}</span><div><strong>${escapeHtml(resource.virtual)}</strong><small>${escapeHtml(resource.kind)}</small></div><i>→</i><p>${escapeHtml(resource.physical)}</p></article>
    `).join("");
    elements.comparisonKernel.textContent = data.comparison.kernel_model;
    elements.comparisonHost.textContent = data.comparison.host_layer;
    elements.comparisonBoundary.textContent = data.comparison.isolation_boundary;
    elements.comparisonArtifact.textContent = data.comparison.boot_artifact;
    selectLayer(data.layers.length - 1);
  }

  async function fetchStack() {
    stackController?.abort();
    stackController = new AbortController();
    try {
      const response = await fetch("/api/105-9/stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack_type: stackType }),
        signal: stackController.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to build virtualization stack.");
      if (!disposed) renderStack(data);
    } catch (error) {
      if (error.name !== "AbortError" && !disposed) elements.layerDetail.textContent = error.message;
    }
  }

  function renderCluster(data) {
    elements.replicaOutput.textContent = data.desired_replicas;
    elements.clusterDesired.textContent = data.desired_replicas;
    elements.clusterRunning.textContent = data.running_replicas;
    elements.clusterPending.textContent = data.pending_replicas;
    elements.clusterHosts.textContent = `${data.healthy_hosts}/3`;
    elements.convergence.className = `virt-convergence ${data.converged ? "converged" : "diverged"}`;
    elements.convergence.innerHTML = data.converged
      ? `<span>RECONCILIATION</span><strong>Desired = actual</strong><small>Cluster has converged.</small>`
      : `<span>RECONCILIATION</span><strong>${data.pending_replicas} Pending</strong><small>Healthy capacity is insufficient.</small>`;
    elements.hostFailure.textContent = failedHosts.includes("host-2") ? "Restore host-2" : "Fail host-2";
    elements.hostFailure.classList.toggle("active-failure", failedHosts.includes("host-2"));
    elements.hostBoard.innerHTML = data.hosts.map((host) => `
      <section class="virt-host ${host.status}">
        <header><div><span>${host.status === "healthy" ? "HOST ONLINE" : "HOST FAILED"}</span><strong>${host.id}</strong></div><b>${host.used_slots}/${host.capacity} slots</b></header>
        <div class="virt-host-slots">
          ${Array.from({ length: host.capacity }, (_, index) => {
            const replica = host.replicas[index];
            return replica
              ? `<article class="virt-replica ${replica.replacement ? "replacement" : ""}"><span>CTR</span><div><strong>${escapeHtml(replica.id)}</strong><small>${replica.cpu} CPU · ${replica.memory_mib} MiB</small></div><i></i></article>`
              : `<article class="virt-empty-slot"><span>${host.status === "healthy" ? "Available slot" : "Unavailable"}</span></article>`;
          }).join("")}
        </div>
      </section>
    `).join("");
    const config = data.configuration;
    elements.config.textContent = `application: ${config.application}\nreplicas: ${config.replicas}\nresources:\n  cpu: ${config.cpu}\n  memory: ${config.memory}`;
    elements.events.innerHTML = data.events.map((event, index) => `<article class="${event.kind}"><span>${String(index + 1).padStart(2, "0")}</span><p>${escapeHtml(event.message)}</p></article>`).join("");
    elements.output.innerHTML = data.output.map((item) => `<div class="${item.status.toLowerCase()}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.host)}</span><b>${escapeHtml(item.status)}</b></div>`).join("");
  }

  async function fetchCluster() {
    clusterController?.abort();
    clusterController = new AbortController();
    try {
      const response = await fetch("/api/105-9/cluster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desired_replicas: Number(elements.replicas.value), failed_hosts: failedHosts, crashed_replica: crashedReplica }),
        signal: clusterController.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reconcile cluster.");
      if (!disposed) renderCluster(data);
    } catch (error) {
      if (error.name !== "AbortError" && !disposed) elements.events.textContent = error.message;
    }
  }

  function scheduleCluster() {
    elements.replicaOutput.textContent = elements.replicas.value;
    crashedReplica = null;
    if (clusterDebounce) window.clearTimeout(clusterDebounce);
    clusterDebounce = window.setTimeout(fetchCluster, 80);
  }

  elements.modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.virtMode)));
  elements.stackButtons.forEach((button) => button.addEventListener("click", () => {
    stackType = button.dataset.stackType;
    elements.stackButtons.forEach((candidate) => {
      const active = candidate.dataset.stackType === stackType;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-selected", String(active));
    });
    fetchStack();
  }));
  elements.replicas.addEventListener("input", scheduleCluster);
  elements.crash.addEventListener("click", () => {
    crashedReplica = Math.min(2, Number(elements.replicas.value));
    fetchCluster();
  });
  elements.hostFailure.addEventListener("click", () => {
    failedHosts = failedHosts.includes("host-2") ? [] : ["host-2"];
    crashedReplica = null;
    fetchCluster();
  });
  elements.restore.addEventListener("click", () => {
    failedHosts = [];
    crashedReplica = null;
    elements.replicas.value = "3";
    fetchCluster();
  });

  elements.modeButtons[0].classList.add("active");
  elements.stackButtons[0].classList.add("active");
  await Promise.all([fetchStack(), fetchCluster()]);

  return () => {
    disposed = true;
    if (clusterDebounce) window.clearTimeout(clusterDebounce);
    stackController?.abort();
    clusterController?.abort();
  };
}
