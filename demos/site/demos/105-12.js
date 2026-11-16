const topologies = {
  ring: { name: "Ring", note: "Each node has two neighbors in one closed loop.", strength: "A second direction can provide an alternate path", cost: "A second break partitions the loop; real recovery depends on implementation", nodes: 6, links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]] },
  mesh: { name: "Full mesh", note: "Every node has a direct link to every other node.", strength: "Many alternate paths", cost: "Link count and cost grow quickly", nodes: 5, links: [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]] },
  star: { name: "Star", note: "Every endpoint connects through one central device.", strength: "Endpoint faults stay isolated", cost: "The center is a critical dependency", nodes: 6, links: [[0,1],[0,2],[0,3],[0,4],[0,5]], center: 0 },
  bus: { name: "Bus", note: "All devices attach to one shared communication backbone.", strength: "Uses relatively little cabling", cost: "The shared backbone is a common failure domain", nodes: 6, links: [[0,1],[1,2],[2,3],[3,4],[4,5]], bus: true, positions: [[8,50],[25,50],[42,50],[58,50],[75,50],[92,50]] },
  hybrid: { name: "Hybrid", note: "Two star segments connect through redundant distribution devices.", strength: "Can balance resilience and scale", cost: "Design and troubleshooting are more complex", nodes: 8, links: [[0,1],[0,2],[0,3],[4,5],[4,6],[4,7],[0,4],[1,5]], center: -1 },
};

function ensureStyle() {
  if (document.querySelector('link[data-mcwo1116-style]')) return;
  const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/demos/105-11-16.css"; link.dataset.mcwo1116Style = "true"; document.head.append(link);
}

function largestConnectedGroup(model, failedNode, failedLink) {
  const active = Array.from({ length: model.nodes }, (_, i) => i).filter(i => i !== failedNode);
  if (!active.length) return 0;
  if (model.bus) {
    if (failedLink < 0) return active.length;
    return Math.max(failedLink + 1, active.length - failedLink - 1);
  }
  const unvisited = new Set(active);
  let largest = 0;
  while (unvisited.size) {
    const start = unvisited.values().next().value;
    const seen = new Set([start]); const queue = [start];
    unvisited.delete(start);
    while (queue.length) {
      const node = queue.shift();
      model.links.forEach((link, index) => {
        if (index === failedLink || link.includes(failedNode)) return;
        const next = link[0] === node ? link[1] : link[1] === node ? link[0] : null;
        if (next !== null && unvisited.has(next)) { seen.add(next); unvisited.delete(next); queue.push(next); }
      });
    }
    largest = Math.max(largest, seen.size);
  }
  return largest;
}

export async function mount(root) {
  ensureStyle();
  root.innerHTML = `<article class="demo-page mcwo1116-page mcwo1116-topology"><header class="demo-header"><div><p class="eyebrow">Module 105.12 · Topology failure lab</p><h1>Where Does the Network Break?</h1><p class="lede">Choose a topology, fail a node or break a link, then see which nodes can still communicate.</p></div></header>
    <section class="mcwo1116-card"><div class="mcwo1116-tabs" role="group" aria-label="Network topology">${Object.entries(topologies).map(([id, item], i) => `<button type="button" data-topology="${id}" aria-pressed="${i === 0}"><strong>${item.name}</strong><small>${{ring: "Closed loop", mesh: "Every pair linked", star: "Central device", bus: "Shared backbone", hybrid: "Combined topologies"}[id]}</small></button>`).join("")}</div>
      <div class="mcwo1116-topology-toolbar"><div><span id="mcwo1116-topology-label"></span><h2 id="mcwo1116-topology-title"></h2><p id="mcwo1116-topology-note"></p></div><div class="mcwo1116-button-row"><button type="button" id="mcwo1116-fail-node">Fail a node</button><button type="button" id="mcwo1116-fail-link">Break a link</button><button type="button" id="mcwo1116-repair">Repair network</button></div></div>
      <div class="mcwo1116-network-board" id="mcwo1116-network-board" aria-label="Topology diagram"></div>
      <div class="mcwo1116-metrics"><span><small>Largest connected group</small><strong id="mcwo1116-reachable"></strong></span><span><small>Physical / logical links</small><strong id="mcwo1116-links"></strong></span><span><small>Connected after a failure?</small><strong id="mcwo1116-redundant"></strong></span></div>
      <div class="mcwo1116-feedback" id="mcwo1116-topology-feedback" aria-live="polite"></div>
    </section>
    <section class="mcwo1116-split mcwo1116-topology-notes"><article><span>STRENGTH</span><h3 id="mcwo1116-strength"></h3></article><article><span>TRADEOFF</span><h3 id="mcwo1116-cost"></h3></article></section>
  </article>`;
  const aborter = new AbortController(); const signal = aborter.signal;
  let type = "ring"; let failedNode = -1; let failedLink = -1;
  const positions = {
    5: [[50,10],[88,38],[74,85],[26,85],[12,38]],
    6: [[50,10],[84,28],[84,72],[50,90],[16,72],[16,28]],
    8: [[23,27],[8,10],[8,44],[23,65],[77,27],[92,10],[92,44],[77,65]],
  };
  function render() {
    const model = topologies[type]; const coords = model.positions || positions[model.nodes];
    root.querySelectorAll("[data-topology]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.topology === type)));
    root.querySelector("#mcwo1116-topology-label").textContent = `${model.nodes} nodes · ${model.links.length} links`;
    root.querySelector("#mcwo1116-topology-title").textContent = model.name;
    root.querySelector("#mcwo1116-topology-note").textContent = model.note;
    root.querySelector("#mcwo1116-strength").textContent = model.strength;
    root.querySelector("#mcwo1116-cost").textContent = model.cost;
    const lines = model.links.map((link, i) => { const [a,b] = link; return `<line class="${i === failedLink ? "failed" : ""}" x1="${coords[a][0]}" y1="${coords[a][1]}" x2="${coords[b][0]}" y2="${coords[b][1]}" vector-effect="non-scaling-stroke"/>`; }).join("");
    const nodes = coords.map((p, i) => `<button type="button" class="mcwo1116-network-node ${i === failedNode ? "failed" : ""} ${model.center === i ? "central" : ""}" style="left:${p[0]}%;top:${p[1]}%" data-node="${i}" aria-label="${model.center === i ? "Central device" : "Node"} ${i + 1}${i === failedNode ? ", failed" : ""}"><i></i><strong>${model.center === i ? "CORE" : `N${i + 1}`}</strong></button>`).join("");
    root.querySelector("#mcwo1116-network-board").innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes}`;
    const reachable = largestConnectedGroup(model, failedNode, failedLink); const active = model.nodes - (failedNode >= 0 ? 1 : 0); const healthy = reachable === active && active > 0;
    root.querySelector("#mcwo1116-reachable").textContent = `${reachable} / ${active}`;
    root.querySelector("#mcwo1116-links").textContent = String(model.links.length);
    root.querySelector("#mcwo1116-redundant").textContent = failedNode < 0 && failedLink < 0 ? "No failure yet" : healthy ? "Yes" : "No";
    let feedback = "All nodes are connected. Fail a node or break a link to test resilience.";
    if (failedNode >= 0) feedback = healthy ? `Node N${failedNode + 1} failed, but all remaining nodes still share a path.` : `Node ${model.center === failedNode ? "CORE" : `N${failedNode + 1}`} failed and split reachability.`;
    if (failedLink >= 0) { const [a,b] = model.links[failedLink]; feedback = healthy ? `Link N${a + 1}–N${b + 1} failed, but an alternate path preserves connectivity.` : `Link N${a + 1}–N${b + 1} failed and separated parts of the network.`; }
    root.querySelector("#mcwo1116-topology-feedback").innerHTML = `<strong>${healthy ? "Connected" : "Partition detected"}</strong><p>${feedback}</p>`;
    root.querySelectorAll("[data-node]").forEach(button => button.addEventListener("click", () => { failedNode = Number(button.dataset.node); failedLink = -1; render(); root.querySelector(`[data-node="${failedNode}"]`)?.focus(); }, { signal, once: true }));
  }
  root.querySelectorAll("[data-topology]").forEach(button => button.addEventListener("click", () => { type = button.dataset.topology; failedNode = -1; failedLink = -1; render(); }, { signal }));
  root.querySelector("#mcwo1116-fail-node").addEventListener("click", () => { const model = topologies[type]; failedNode = model.center === 0 ? 0 : 2; failedLink = -1; render(); }, { signal });
  root.querySelector("#mcwo1116-fail-link").addEventListener("click", () => { failedLink = type === "hybrid" ? 6 : 1; failedNode = -1; render(); }, { signal });
  root.querySelector("#mcwo1116-repair").addEventListener("click", () => { failedNode = -1; failedLink = -1; render(); }, { signal });
  render(); return () => aborter.abort();
}
