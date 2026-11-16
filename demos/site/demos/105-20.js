const baseEvents = [
  ["C → S", "SYN", "seq 100", "Client requests a connection and supplies its initial sequence number."],
  ["S → C", "SYN + ACK", "seq 500 · ack 101", "Server acknowledges the request and supplies its own initial sequence number."],
  ["C → S", "ACK", "ack 501", "Client acknowledges the server. The logical connection is established."],
  ["C → S", "DATA", "seq 101 · 400 B", "The first ordered application segment is sent."],
  ["S → C", "ACK", "ack 501", "The server acknowledges the next byte it expects."],
  ["C → S", "DATA", "seq 501 · 400 B", "The next segment continues the byte stream."],
  ["S → C", "ACK", "ack 901", "The server confirms both data segments are in order."],
  ["C → S", "FIN", "seq 901", "The client requests orderly connection termination."],
  ["S → C", "ACK + FIN", "ack 902", "The server acknowledges and closes its side."],
  ["C → S", "ACK", "final", "The close exchange completes."],
];

export async function mount(root) {
  root.innerHTML = `
    <article class="demo-page s20-page"><header class="demo-header"><div><p class="eyebrow">Module 105.20 · Connection-oriented trace</p><h1>Connection-oriented protocols</h1><p class="lede">Step through a simplified TCP exchange and optionally lose a data segment to show acknowledgments and retransmission.</p></div><div class="concept-key"><span class="chip protocol">TCP</span><span class="chip data">Sequence</span><span class="chip concept">Acknowledgment</span></div></header>
      <section class="experiment-card s20-lab">
        <div class="s20-top"><label class="s20-loss"><input id="s20-loss" type="checkbox"><span><strong>Lose first data segment</strong><small>Trigger deterministic retransmission after a timeout</small></span></label><div class="s20-state" id="s20-state" aria-live="polite"><span>CONNECTION STATE</span><strong>Closed</strong></div></div>
        <div class="s20-peers"><article><span>CLIENT</span><strong>192.0.2.10:51514</strong></article><div class="s20-wire"><i id="s20-packet">SYN</i></div><article><span>SERVER</span><strong>198.51.100.8:443</strong></article></div>
        <div class="s20-stage" id="s20-stage" aria-live="polite"><span>READY</span><h2>Begin with a three-way handshake</h2><p>TCP establishes state before exchanging application data.</p></div>
        <ol class="s20-log" id="s20-log" aria-label="TCP event log"></ol>
        <div class="s20-controls"><button class="button subtle" id="s20-reset" type="button">Reset</button><button class="button primary" id="s20-next" type="button">Send SYN</button><span id="s20-counter">0 / 10 events</span></div>
      </section>
      <div class="s20-principles"><article><span>LOSS COST</span><strong>Recovery adds delay</strong><p>A sender must detect missing acknowledgment before it can retransmit lost data.</p></article><article><span>ORDER COST</span><strong>Later bytes may wait</strong><p>Reliable in-order delivery can hold later data until a gap is filled.</p></article><article><span>STATE COST</span><strong>Endpoints retain context</strong><p>Sequence numbers, acknowledgments, and flow-control state use resources for each connection.</p></article><article><span>CLOSE</span><strong>Both directions finish</strong><p>An orderly close accounts for each endpoint's side of the byte stream.</p></article></div>
    </article>`;
  let index = 0, events = [];
  const loss = root.querySelector("#s20-loss"), log = root.querySelector("#s20-log"), packet = root.querySelector("#s20-packet"), next = root.querySelector("#s20-next");
  function buildEvents() {
    events = baseEvents.map((event) => [...event]);
    if (loss.checked) events.splice(4, 0, ["C ⇢ ×", "DATA LOST", "seq 101 · 400 B", "No acknowledgment arrives; TCP retains state and waits for its retransmission timer."], ["C → S", "RETRANSMIT", "seq 101 · 400 B", "The missing segment is sent again before later bytes are acknowledged."]);
  }
  function stateFor(done) { if (done === 0) return "Closed"; if (done < 3) return "Handshaking"; if (done < events.length - 2) return "Established"; if (done < events.length) return "Closing"; return "Closed · complete"; }
  function render() {
    const visible = events.slice(0, index);
    log.innerHTML = visible.map((event, i) => `<li class="${event[1] === "DATA LOST" ? "s20-dropped" : ""}"><span>${String(i + 1).padStart(2, "0")}</span><b>${event[0]}</b><strong>${event[1]}</strong><code>${event[2]}</code></li>`).join("");
    const current = visible.at(-1);
    root.querySelector("#s20-state strong").textContent = stateFor(index);
    root.querySelector("#s20-counter").textContent = `${index} / ${events.length} events`;
    if (current) { packet.textContent = current[1]; packet.className = current[1] === "DATA LOST" ? "s20-packet-lost" : ""; root.querySelector("#s20-stage").innerHTML = `<span>${current[0]}</span><h2>${current[1]} · ${current[2]}</h2><p>${current[3]}</p>`; }
    else { packet.textContent = "SYN"; packet.className = ""; root.querySelector("#s20-stage").innerHTML = `<span>READY</span><h2>Begin with a three-way handshake</h2><p>TCP establishes state before exchanging application data.</p>`; }
    next.disabled = index >= events.length;
    next.textContent = index >= events.length ? "Trace complete" : index === 0 ? "Send SYN" : "Next event";
  }
  function reset() { index = 0; buildEvents(); render(); }
  next.addEventListener("click", () => { if (index < events.length) index += 1; render(); });
  root.querySelector("#s20-reset").addEventListener("click", reset);
  loss.addEventListener("change", reset);
  reset();
  return () => {};
}
