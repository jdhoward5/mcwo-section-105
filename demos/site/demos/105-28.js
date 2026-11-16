function loadStyles() {
  if (document.querySelector('link[data-m2328-styles]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./demos/105-23-28.css";
  link.dataset.m2328Styles = "true";
  document.head.append(link);
}

const VIEWS = {
  p2p: {
    eyebrow: "Architecture",
    title: "Peer-to-peer network",
    description: "Peers can request and serve resources directly without routing every exchange through one central service.",
    action: "Share between peers",
    facts: [
      ["PARTICIPANTS", "Client + server roles"],
      ["SHARED STATE", "Optional"],
      ["CORE CHALLENGE", "Discovery and trust"],
    ],
    peerLabels: ["Requester", "Provider", "Peer", "Peer"],
  },
  blockchain: {
    eyebrow: "Distributed ledger",
    title: "Blockchain",
    description: "Peers use a consensus method to agree on append-oriented records grouped into cryptographically linked blocks.",
    action: "Propose transfer",
    facts: [
      ["PARTICIPANTS", "Ledger replicas"],
      ["SHARED STATE", "Consensus required"],
      ["CORE CHALLENGE", "Scale, privacy, governance"],
    ],
    peerLabels: ["Validator A", "Validator B", "Validator C", "Validator D"],
  },
  contract: {
    eyebrow: "Ledger program",
    title: "Smart contract",
    description: "Program code stored in a blockchain or distributed ledger applies predefined rules to a transaction.",
    action: "Execute contract",
    facts: [
      ["PARTICIPANTS", "Executing nodes"],
      ["SHARED STATE", "Deterministic result"],
      ["CORE CHALLENGE", "Code and external data"],
    ],
    peerLabels: ["Node A", "Node B", "Node C", "Node D"],
  },
};

const INITIAL_RESULTS = {
  p2p: ["READY FOR DIRECT EXCHANGE", "Peer A can request from Peer B", "Run the exchange to see how peers share without a central relay."],
  blockchain: ["LEDGER READY", "Propose the first block", "Each accepted record will point to the previous block's teaching hash."],
  contract: ["RULES LOADED", "Amount ≤ 75 and approval required", "Change the amount or external signal, then execute the same rule on every node."],
};

export async function mount(root) {
  loadStyles();
  root.innerHTML = `
    <article class="m2328-page m2328-distributed-page">
      <header class="m2328-header">
        <div>
          <p class="m2328-kicker">Module 105.28 · Distributed systems</p>
          <h1>Compare three distributed-system patterns</h1>
          <p>Follow one exchange from peer-to-peer sharing, to a replicated ledger, to code that executes on that ledger.</p>
        </div>
        <span class="m2328-badge">Distributed state lab</span>
      </header>

      <section class="m2328-panel m2328-distributed">
        <div class="m2328-distributed-tabs" role="tablist" aria-label="Distributed-system concept">
          ${Object.entries(VIEWS).map(([key, item], index) => `
            <button type="button" role="tab" id="m2328-tab-${key}" data-view="${key}" aria-selected="${index === 0}" aria-controls="m2328-distributed-panel">
              <span>0${index + 1}</span><strong>${item.title}</strong><small>${item.eyebrow}</small>
            </button>`).join("")}
        </div>

        <div class="m2328-distributed-stage" id="m2328-distributed-panel" role="tabpanel" aria-labelledby="m2328-tab-p2p">
          <header>
            <div><span data-view-label></span><h2 data-view-title></h2><p data-view-desc></p></div>
            <button type="button" data-reset>Reset lab</button>
          </header>

          <div class="m2328-distributed-facts" data-facts></div>

          <div class="m2328-distributed-controls" data-controls>
            <label>
              <span data-amount-label>Resource size</span>
              <input data-amount type="range" min="5" max="120" value="35" step="5">
              <output data-amount-out>35 MB</output>
            </label>
            <label class="m2328-oracle">
              <span>External approval signal</span>
              <input data-oracle type="checkbox" role="switch" checked>
              <output data-oracle-out>Available · approved</output>
            </label>
            <button type="button" data-run></button>
            <button type="button" data-tamper>Alter first block</button>
          </div>

          <div class="m2328-network" data-network aria-label="Four connected peers">
            <svg viewBox="0 0 600 260" aria-hidden="true">
              <path d="M100 70 L300 40 L500 90 L400 220 L100 70 M100 70 L500 90 M300 40 L400 220"/>
            </svg>
            ${["A", "B", "C", "D"].map((name, index) => `
              <span class="m2328-peer m2328-peer-${index}">
                <i></i><b data-peer-name="${index}">Peer ${name}</b><small data-peer="${index}">ready</small>
              </span>`).join("")}
          </div>

          <section class="m2328-ledger-wrap" data-ledger-wrap aria-label="Illustrative ledger">
            <header><span>LEDGER CHAIN</span><strong data-ledger-count>0 blocks</strong></header>
            <div class="m2328-ledger" data-ledger></div>
          </section>

          <div class="m2328-distributed-result" data-result aria-live="polite"></div>

          <div class="m2328-distributed-lineage" aria-label="Relationship among the concepts">
            <span>Peer network</span><b>can support</b><span>Distributed ledger</span><b>can execute</b><span>Smart contract</span>
          </div>
        </div>
      </section>

      <aside class="m2328-note">
        <strong>Model limits</strong>
        <span>Consensus rules vary by blockchain. The short hashes shown here are deterministic teaching tokens—not production cryptography—and real performance, privacy, governance, and fault assumptions depend on the implementation.</span>
      </aside>
    </article>`;

  let view = "p2p";
  let blocks = [];
  let sequence = 0;
  let result = null;
  const listeners = [];
  const q = (selector) => root.querySelector(selector);
  const tabButtons = [...root.querySelectorAll("[data-view]")];

  function on(element, type, listener) {
    element.addEventListener(type, listener);
    listeners.push(() => element.removeEventListener(type, listener));
  }

  function teachingHash(text) {
    let value = 5381;
    for (const character of text) value = ((value << 5) + value) ^ character.charCodeAt(0);
    return (value >>> 0).toString(16).padStart(8, "0").toUpperCase();
  }

  function setPeerStates(states) {
    root.querySelectorAll("[data-peer]").forEach((peer, index) => {
      peer.textContent = states[index] || "ready";
    });
  }

  function renderResult() {
    const chainInvalid = blocks.some((block) => block.invalid);
    const content = result || (chainInvalid && view !== "p2p"
      ? ["CHAIN INVALID", "Reset required before new ledger activity", "Peers should not extend a history that fails validation."]
      : INITIAL_RESULTS[view]);
    q("[data-result]").className = `m2328-distributed-result m2328-result-${view} ${result?.[3] || ""}`;
    q("[data-result]").innerHTML = `<span>${content[0]}</span><strong>${content[1]}</strong><p>${content[2]}</p>`;
  }

  function renderLedger() {
    const ledgerVisible = view !== "p2p";
    q("[data-ledger-wrap]").hidden = !ledgerVisible;
    q("[data-ledger-count]").textContent = `${blocks.length} block${blocks.length === 1 ? "" : "s"}`;
    q("[data-ledger]").innerHTML = blocks.length
      ? blocks.map((block, index) => `
          <article class="${block.invalid ? "m2328-invalid" : ""}">
            <span>BLOCK ${String(index + 1).padStart(2, "0")} · ${block.kind}</span>
            <strong>${block.amount} credits</strong>
            <small>${block.status} · prev ${block.previous}</small>
            <code>${block.hash}</code>
          </article>`).join("")
      : `<p>No blocks appended yet. Run the ${view === "contract" ? "contract" : "transfer"} to create one.</p>`;
  }

  function render() {
    const current = VIEWS[view];
    q("[data-view-label]").textContent = current.eyebrow.toUpperCase();
    q("#m2328-distributed-panel").setAttribute("aria-labelledby", `m2328-tab-${view}`);
    q("[data-view-title]").textContent = current.title;
    q("[data-view-desc]").textContent = current.description;
    q("[data-facts]").innerHTML = current.facts.map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`).join("");
    q("[data-network]").className = `m2328-network m2328-network-${view}`;
    q("[data-controls]").className = `m2328-distributed-controls m2328-distributed-controls-${view}`;
    q("[data-amount-label]").textContent = view === "p2p" ? "Resource size" : "Transfer amount";
    q("[data-amount-out]").textContent = `${q("[data-amount]").value} ${view === "p2p" ? "MB" : "credits"}`;
    q("[data-oracle-out]").textContent = q("[data-oracle]").checked ? "Available · approved" : "Unavailable · untrusted";
    q("[data-oracle]").closest("label").hidden = view !== "contract";
    q("[data-run]").textContent = current.action;
    q("[data-run]").disabled = blocks.some((block) => block.invalid) && view !== "p2p";
    q("[data-tamper]").hidden = view !== "blockchain";
    q("[data-tamper]").disabled = blocks.length < 2;
    current.peerLabels.forEach((label, index) => { q(`[data-peer-name="${index}"]`).textContent = label; });
    tabButtons.forEach((button) => {
      const active = button.dataset.view === view;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    renderLedger();
    renderResult();
  }

  function appendBlock(amount, kind, status) {
    const previous = blocks.at(-1)?.hash || "GENESIS";
    const hash = teachingHash(`${previous}:${amount}:${kind}:${status}:${sequence}`);
    blocks.push({ amount, kind, status, previous, hash, invalid: false });
    return hash;
  }

  function transact() {
    sequence += 1;
    const amount = Number(q("[data-amount]").value);

    if (view === "p2p") {
      setPeerStates(["requesting", "serving", "discoverable", "discoverable"]);
      result = [
        "DIRECT EXCHANGE COMPLETE",
        `Peer A received a ${amount} MB resource from Peer B`,
        "No central service relayed the exchange. The peers still need discovery, trust, coordination, and security.",
      ];
    } else if (view === "blockchain") {
      setPeerStates(["proposed", "validated", "validated", "validated"]);
      const hash = appendBlock(amount, "TRANSFER", "ACCEPTED");
      result = [
        "CONSENSUS OUTCOME ILLUSTRATED",
        `Block appended · ${hash}`,
        `In this simplified example, the peers accept the proposed block. It points to ${blocks.at(-1).previous}, and each peer now shows the same teaching record.`,
      ];
    } else {
      const signalAvailable = q("[data-oracle]").checked;
      const approved = signalAvailable && amount <= 75;
      setPeerStates(["executed", "executed", "executed", "executed"]);
      const hash = appendBlock(amount, "CONTRACT", approved ? "PASS" : "REJECT");
      result = [
        "CONTRACT EXECUTED",
        approved ? "Rule passed · transfer applied" : "Rule rejected · no transfer",
        !signalAvailable
          ? `Receipt ${hash} records that the required external signal was unavailable or untrusted.`
          : amount > 75
            ? `Receipt ${hash} records that ${amount} exceeds the predefined 75-credit maximum.`
            : `Receipt ${hash} records that both the approval signal and amount rule passed.`,
        approved ? "m2328-result-pass" : "m2328-result-reject",
      ];
    }
    render();
  }

  function tamper() {
    if (blocks.length < 2) return;
    blocks[0].amount += 10;
    blocks.forEach((block) => { block.invalid = true; });
    setPeerStates(["mismatch", "mismatch", "mismatch", "mismatch"]);
    result = [
      "TAMPER DETECTED",
      "The hash chain no longer validates",
      "Changing the first record no longer matches its displayed hash, so every later reference derived from that chain is suspect.",
      "m2328-result-reject",
    ];
    render();
  }

  function selectView(nextView) {
    view = nextView;
    result = null;
    setPeerStates(["ready", "ready", "ready", "ready"]);
    render();
  }

  tabButtons.forEach((button, index) => {
    on(button, "click", () => selectView(button.dataset.view));
    on(button, "keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabButtons.length - 1 : index + (event.key === "ArrowRight" ? 1 : -1);
      nextIndex = (nextIndex + tabButtons.length) % tabButtons.length;
      tabButtons[nextIndex].focus();
      tabButtons[nextIndex].click();
    });
  });
  on(q("[data-amount]"), "input", () => { result = null; render(); });
  on(q("[data-oracle]"), "input", () => { result = null; render(); });
  on(q("[data-run]"), "click", transact);
  on(q("[data-tamper]"), "click", tamper);
  on(q("[data-reset]"), "click", () => {
    blocks = [];
    sequence = 0;
    result = null;
    q("[data-amount]").value = 35;
    q("[data-oracle]").checked = true;
    setPeerStates(["ready", "ready", "ready", "ready"]);
    render();
  });

  render();
  return () => listeners.splice(0).forEach((remove) => remove());
}
