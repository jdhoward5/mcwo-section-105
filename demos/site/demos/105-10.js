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
    <article class="demo-page tradeoff-page">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Module 105.10 · Virtualization tradeoff lab</p>
          <h1>Consolidation Has Consequences</h1>
          <p class="lede">Place the same workloads on dedicated servers and virtual machines, then change demand or fail a host to see both sides of virtualization.</p>
        </div>
        <div class="concept-key" aria-label="Concept key">
          <span class="chip data">Utilization</span>
          <span class="chip algorithm">Overhead</span>
          <span class="chip encoding">Isolation</span>
          <span class="chip concept">Recovery</span>
        </div>
      </header>

      <section class="experiment-card tradeoff-lab">
        <div class="tradeoff-scenario-switch" role="tablist" aria-label="Virtualization scenario">
          <button type="button" role="tab" data-tradeoff-scenario="steady" aria-selected="true"><span>01</span><div><strong>Steady-state comparison</strong><small>Consolidation, utilization, and contention</small></div></button>
          <button type="button" role="tab" data-tradeoff-scenario="failure" aria-selected="false"><span>02</span><div><strong>Host failure drill</strong><small>Blast radius, portability, and recovery</small></div></button>
        </div>

        <div class="tradeoff-controls">
          <label>
            <span><strong>Application workloads</strong><b id="tradeoff-workload-output">4</b></span>
            <input id="tradeoff-workloads" type="range" min="2" max="8" value="4" step="1">
            <small>Dedicated uses one physical server per workload.</small>
          </label>
          <label>
            <span><strong>CPU demand per workload</strong><b id="tradeoff-demand-output">20%</b></span>
            <input id="tradeoff-demand" type="range" min="10" max="60" value="20" step="5">
            <small>Illustrative useful demand, not benchmark output.</small>
          </label>
          <fieldset>
            <legend>Virtual hosts</legend>
            <div class="tradeoff-host-count"><button type="button" data-virtual-hosts="2" aria-pressed="true">2 hosts</button><button type="button" data-virtual-hosts="3" aria-pressed="false">3 hosts</button></div>
            <small>Each virtual host has 100 illustrative CPU points.</small>
          </fieldset>
          <button class="tradeoff-recovery-toggle unavailable" id="tradeoff-recovery" type="button" aria-pressed="true" disabled><span>FAILURE RECOVERY</span><strong>Automatic restart enabled</strong><small>Available during the failure drill</small></button>
        </div>

        <div class="tradeoff-status consolidated" id="tradeoff-status">
          <div><span>MODEL STATUS</span><h2>Consolidated</h2><p>The current workload fits without exceeding host capacity.</p></div>
          <div class="tradeoff-status-meter"><span>Virtual allocation</span><strong id="tradeoff-allocation">—</strong><i><b id="tradeoff-allocation-bar"></b></i></div>
        </div>

        <div class="tradeoff-metrics" aria-label="Virtualization comparison metrics">
          <span><small>Physical hosts saved</small><strong id="hosts-saved">—</strong></span>
          <span><small>VM overhead points</small><strong id="overhead-points">—</strong></span>
          <span><small>Contention points</small><strong id="contention-points">—</strong></span>
          <span><small>Available workloads</small><strong id="available-workloads">—</strong></span>
        </div>

        <div class="tradeoff-comparison">
          <section class="dedicated-side">
            <header><div><span>DEDICATED MODEL</span><h2>One workload per server</h2></div><b id="dedicated-host-count">— hosts</b></header>
            <div class="dedicated-rack" id="dedicated-rack"></div>
            <p>A hardware failure affects the workload assigned to that server, but unused capacity cannot serve its neighbors.</p>
          </section>
          <section class="virtual-side">
            <header><div><span>VIRTUALIZED MODEL</span><h2>Type 1 VM pool</h2></div><b id="virtual-host-count">— hosts</b></header>
            <div class="virtual-rack" id="virtual-rack"></div>
            <p>VMs share physical capacity through a hypervisor. This improves consolidation while creating overhead, contention, and shared-host risk.</p>
          </section>
        </div>

        <div class="tradeoff-legend"><span><i class="useful"></i>Useful workload</span><span><i class="overhead"></i>Virtualization overhead</span><span><i class="free"></i>Free capacity</span><span><i class="overload"></i>Demand beyond capacity</span></div>

        <div class="tradeoff-events" id="tradeoff-events" hidden>
          <header><span>FAILURE + RECOVERY TIMELINE</span><strong id="failure-blast-radius"></strong></header>
          <div id="tradeoff-event-list"></div>
        </div>
      </section>

      <section class="tradeoff-balance">
        <div class="tradeoff-column benefits">
          <header><span>ADVANTAGES</span><h2>What virtualization enables</h2></header>
          <div id="tradeoff-benefits"></div>
        </div>
        <div class="tradeoff-column disadvantages">
          <header><span>DISADVANTAGES</span><h2>What virtualization introduces</h2></header>
          <div id="tradeoff-disadvantages"></div>
        </div>
      </section>
      <p class="tradeoff-scope" id="tradeoff-scope"></p>
    </article>
  `;

  const elements = {
    scenarioButtons: [...root.querySelectorAll("[data-tradeoff-scenario]")],
    workloads: root.querySelector("#tradeoff-workloads"),
    workloadOutput: root.querySelector("#tradeoff-workload-output"),
    demand: root.querySelector("#tradeoff-demand"),
    demandOutput: root.querySelector("#tradeoff-demand-output"),
    hostButtons: [...root.querySelectorAll("[data-virtual-hosts]")],
    recovery: root.querySelector("#tradeoff-recovery"),
    status: root.querySelector("#tradeoff-status"),
    allocation: root.querySelector("#tradeoff-allocation"),
    allocationBar: root.querySelector("#tradeoff-allocation-bar"),
    hostsSaved: root.querySelector("#hosts-saved"),
    overhead: root.querySelector("#overhead-points"),
    contention: root.querySelector("#contention-points"),
    available: root.querySelector("#available-workloads"),
    dedicatedHostCount: root.querySelector("#dedicated-host-count"),
    virtualHostCount: root.querySelector("#virtual-host-count"),
    dedicatedRack: root.querySelector("#dedicated-rack"),
    virtualRack: root.querySelector("#virtual-rack"),
    events: root.querySelector("#tradeoff-events"),
    blastRadius: root.querySelector("#failure-blast-radius"),
    eventList: root.querySelector("#tradeoff-event-list"),
    benefits: root.querySelector("#tradeoff-benefits"),
    disadvantages: root.querySelector("#tradeoff-disadvantages"),
    scope: root.querySelector("#tradeoff-scope"),
  };

  let scenario = "steady";
  let virtualHosts = 2;
  let recoveryEnabled = true;
  let controller = null;
  let debounce = null;
  let disposed = false;

  function usageBar(used, overhead = 0) {
    const useful = Math.max(0, used - overhead);
    const usefulWidth = Math.min(100, useful);
    const overheadWidth = Math.min(Math.max(0, 100 - usefulWidth), overhead);
    const overload = Math.max(0, used - 100);
    return `<div class="capacity-bar"><i class="useful" style="width:${usefulWidth}%"></i><i class="overhead" style="width:${overheadWidth}%"></i>${overload ? `<i class="overload" style="width:${Math.min(35, overload)}%"></i>` : ""}</div>`;
  }

  function renderDedicated(data) {
    elements.dedicatedHostCount.textContent = `${data.physical_hosts} hosts`;
    elements.dedicatedRack.innerHTML = data.hosts.map((host) => {
      const workload = host.workloads[0];
      const footer = host.status === "failed"
        ? "<span>0% available</span><b>offline</b>"
        : `<span>${host.used_points}% useful</span><b>${100 - host.used_points}% idle</b>`;
      return `<article class="dedicated-server ${host.status}"><header><span>${escapeHtml(host.id)}</span><i></i></header><div><strong>${escapeHtml(workload.id)}</strong><small>${workload.status}</small></div>${usageBar(host.used_points)}<footer>${footer}</footer></article>`;
    }).join("");
  }

  function renderVirtualized(data) {
    elements.virtualHostCount.textContent = `${data.physical_hosts} hosts`;
    elements.virtualRack.innerHTML = data.hosts.map((host) => {
      const visibleVms = host.vms;
      const overhead = host.status === "failed" ? 0 : visibleVms.filter(vm => vm.status !== "interrupted").length * 4;
      return `<article class="tradeoff-vm-host ${host.status} ${host.overloaded ? "contended" : ""}">
        <header><div><span>${host.status === "failed" ? "HOST FAILED" : host.overloaded ? "CONTENDED" : "HYPERVISOR ONLINE"}</span><strong>${escapeHtml(host.id)}</strong></div><b>${host.used_points} / 100</b></header>
        <div class="tradeoff-vms">${visibleVms.map(vm => `<span class="tradeoff-vm ${vm.status}"><i>VM</i><strong>${escapeHtml(vm.id)}</strong><small>${escapeHtml(vm.status)}</small></span>`).join("")}</div>
        ${usageBar(host.used_points, overhead)}
        <footer><span>${Math.max(0, host.used_points - overhead)} useful</span><b>${overhead} overhead</b></footer>
      </article>`;
    }).join("");
  }

  function renderTradeoffCards(target, cards) {
    target.innerHTML = cards.map((card, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.evidence)}</p></div></article>`).join("");
  }

  function render(data) {
    const virtualized = data.virtualized;
    elements.workloadOutput.textContent = data.inputs.workloads;
    elements.demandOutput.textContent = `${data.inputs.demand_percent}%`;
    elements.status.className = `tradeoff-status ${data.summary.health.toLowerCase().replaceAll(" ", "-")}`;
    elements.status.querySelector("h2").textContent = data.summary.health;
    elements.status.querySelector("p").textContent = data.summary.detail;
    elements.allocation.textContent = `${virtualized.average_allocated_percent}%`;
    // Slide a full-width fill inside the clipped track to preserve the rounded caps.
    elements.allocationBar.style.transform = `translateX(${Math.min(100, virtualized.average_allocated_percent) - 100}%)`;
    elements.hostsSaved.textContent = data.summary.hosts_saved;
    elements.overhead.textContent = virtualized.overhead_points;
    elements.contention.textContent = virtualized.contention_points;
    elements.available.textContent = `${virtualized.available_workloads}/${data.inputs.workloads}`;
    renderDedicated(data.dedicated);
    renderVirtualized(virtualized);
    elements.events.hidden = data.inputs.scenario !== "failure";
    elements.blastRadius.textContent = `Dedicated: 1 workload · Virtualized: ${virtualized.failure_blast_radius} VMs interrupted`;
    elements.eventList.innerHTML = data.events.map((event, index) => `<article class="${event.kind}"><span>${String(index + 1).padStart(2, "0")}</span><p>${escapeHtml(event.message)}</p></article>`).join("");
    renderTradeoffCards(elements.benefits, data.benefits);
    renderTradeoffCards(elements.disadvantages, data.disadvantages);
    elements.scope.textContent = data.scope;
  }

  async function fetchAnalysis() {
    controller?.abort();
    controller = new AbortController();
    try {
      const response = await fetch("/api/105-10/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workloads: Number(elements.workloads.value),
          demand_percent: Number(elements.demand.value),
          virtual_hosts: virtualHosts,
          scenario,
          recovery_enabled: recoveryEnabled,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to analyze virtualization tradeoffs.");
      if (!disposed) render(data);
    } catch (error) {
      if (error.name !== "AbortError" && !disposed) elements.status.querySelector("p").textContent = error.message;
    }
  }

  function scheduleAnalysis() {
    elements.workloadOutput.textContent = elements.workloads.value;
    elements.demandOutput.textContent = `${elements.demand.value}%`;
    if (debounce) window.clearTimeout(debounce);
    debounce = window.setTimeout(fetchAnalysis, 80);
  }

  elements.scenarioButtons.forEach((button) => button.addEventListener("click", () => {
    scenario = button.dataset.tradeoffScenario;
    elements.scenarioButtons.forEach((candidate) => {
      const active = candidate.dataset.tradeoffScenario === scenario;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-selected", String(active));
    });
    elements.recovery.disabled = scenario !== "failure";
    elements.recovery.classList.toggle("unavailable", scenario !== "failure");
    fetchAnalysis();
  }));
  elements.workloads.addEventListener("input", scheduleAnalysis);
  elements.demand.addEventListener("input", scheduleAnalysis);
  elements.hostButtons.forEach((button) => button.addEventListener("click", () => {
    virtualHosts = Number(button.dataset.virtualHosts);
    elements.hostButtons.forEach((candidate) => {
      const active = Number(candidate.dataset.virtualHosts) === virtualHosts;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    fetchAnalysis();
  }));
  elements.recovery.addEventListener("click", () => {
    recoveryEnabled = !recoveryEnabled;
    elements.recovery.classList.toggle("disabled", !recoveryEnabled);
    elements.recovery.setAttribute("aria-pressed", String(recoveryEnabled));
    elements.recovery.querySelector("strong").textContent = recoveryEnabled ? "Automatic restart enabled" : "Automatic restart disabled";
    fetchAnalysis();
  });

  elements.scenarioButtons[0].classList.add("active");
  elements.hostButtons[0].classList.add("active");
  await fetchAnalysis();

  return () => {
    disposed = true;
    if (debounce) window.clearTimeout(debounce);
    controller?.abort();
  };
}
