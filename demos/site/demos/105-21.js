export async function mount(root) {
  root.innerHTML = `
    <article class="demo-page s21-page"><header class="demo-header"><div><p class="eyebrow">Module 105.21 · Datagram simulator</p><h1>Connectionless protocols</h1><p class="lede">UDP sends independent datagrams without a connection. Send a burst, then add application-level recovery when delivery guarantees matter.</p></div><div class="concept-key"><span class="chip protocol">UDP</span><span class="chip algorithm">Low overhead</span><span class="chip concept">App reliability</span></div></header>
      <section class="experiment-card s21-lab">
        <div class="s21-controls"><label><span>Datagrams in burst <b id="s21-count-out">6</b></span><input id="s21-count" type="range" min="3" max="10" value="6"></label><label><input id="s21-loss" type="checkbox" checked><span>Drop datagram 3</span></label><label><input id="s21-reorder" type="checkbox" checked><span>Delay datagram 2</span></label><label><input id="s21-reliable" type="checkbox"><span>Application ACK + retry</span></label><button class="button primary" id="s21-send" type="button">Send burst</button></div>
        <div class="s21-path"><article><span>SENDER</span><strong>Telemetry sensor</strong><small>No connection setup</small></article><div class="s21-flight" id="s21-flight" aria-label="Datagrams sent"></div><article><span>RECEIVER</span><strong>Collector</strong><small id="s21-receiver-note">Processes arrivals</small></article></div>
        <div class="s21-result" id="s21-result" aria-live="polite"></div>
        <div class="s21-ledger"><section><span>SEND ORDER</span><div id="s21-sent"></div></section><section><span>ARRIVAL ORDER</span><div id="s21-arrived"></div></section></div>
        <div class="s21-events" id="s21-events"></div>
      </section>
      <div class="s21-facts"><article><strong>No handshake</strong><p>UDP can send a datagram without establishing a persistent session first.</p></article><article><strong>Independent messages</strong><p>Each datagram carries addressing information and may take a different path.</p></article><article><strong>No built-in guarantees</strong><p>UDP itself does not guarantee delivery, order, or duplicate suppression.</p></article><article><strong>Application choice</strong><p>An application can add acknowledgments, retries, sequence numbers, or tolerate loss.</p></article></div>
    </article>`;
  const count = root.querySelector("#s21-count"), lose = root.querySelector("#s21-loss"), reorder = root.querySelector("#s21-reorder"), reliable = root.querySelector("#s21-reliable");
  const send = root.querySelector("#s21-send");
  const aborter = new AbortController();
  const signal = aborter.signal;
  const chip = (number, state = "") => `<span class="s21-datagram ${state}"><b>${number}</b><small>DG</small></span>`;
  function markReady() {
    const total = Number(count.value);
    root.querySelector("#s21-count-out").textContent = total;
    root.querySelector("#s21-flight").innerHTML = `<span class="s21-placeholder">Waiting to send</span>`;
    root.querySelector("#s21-sent").innerHTML = `<span class="s21-placeholder">Not sent</span>`;
    root.querySelector("#s21-arrived").innerHTML = `<span class="s21-placeholder">No arrivals</span>`;
    const result = root.querySelector("#s21-result");
    result.className = "s21-result s21-ready";
    result.innerHTML = `<span>BURST READY</span><strong>${total} datagrams configured.</strong><p>Send the burst to apply the selected loss, delay, and application-recovery conditions.</p>`;
    root.querySelector("#s21-events").innerHTML = `<span>WIRE EVENTS</span><p>No datagrams have been sent with these settings.</p>`;
    root.querySelector("#s21-receiver-note").textContent = "Waiting for burst";
    send.textContent = "Send burst";
  }
  function simulate() {
    const total = Number(count.value);
    const sent = Array.from({ length: total }, (_, i) => i + 1);
    let arrived = sent.filter((n) => !(lose.checked && n === 3));
    if (reorder.checked && arrived.includes(2)) { arrived = arrived.filter((n) => n !== 2); arrived.splice(Math.min(3, arrived.length), 0, 2); }
    const firstPass = [...arrived];
    let retried = false;
    if (reliable.checked && lose.checked && sent.includes(3)) { arrived.push(3); retried = true; }
    root.querySelector("#s21-sent").innerHTML = sent.map((n) => chip(n)).join("");
    root.querySelector("#s21-arrived").innerHTML = arrived.map((n, i) => chip(n, retried && i === arrived.length - 1 ? "s21-retried" : "")).join("");
    root.querySelector("#s21-flight").innerHTML = sent.map((n) => chip(n, lose.checked && n === 3 ? "s21-lost" : reorder.checked && n === 2 ? "s21-delayed" : "")).join("");
    const missing = sent.filter((n) => !firstPass.includes(n));
    const firstPassInOrder = firstPass.every((n, i, list) => i === 0 || list[i - 1] < n);
    const finalInOrder = arrived.every((n, i, list) => i === 0 || list[i - 1] < n);
    const finalComplete = arrived.length === sent.length;
    const orderSummary = finalComplete
      ? finalInOrder ? " in sending order" : "; final arrival order changed"
      : firstPassInOrder ? " in sending order, with gaps" : "; arrival order changed and has gaps";
    const result = root.querySelector("#s21-result");
    result.className = `s21-result ${finalComplete && !missing.length ? "s21-clean" : finalComplete ? "s21-recovered" : "s21-impaired"}`;
    result.innerHTML = `<span>${finalComplete ? missing.length ? "APPLICATION RECOVERED LOSS" : "ALL DATAGRAMS ARRIVED" : "BEST-EFFORT DELIVERY"}</span><strong>${arrived.length} of ${sent.length} received${orderSummary}.</strong><p>${missing.length ? `Datagram ${missing.join(", ")} was lost${retried ? " and retried by the application" : "; UDP did not retry it"}.` : "This run had no loss, but UDP still made no delivery guarantee."}</p>`;
    const appAction = retried ? "application detects the missing ID and retries it" : reliable.checked ? "application verifies the IDs; no retry is needed" : "receiver accepts what arrives";
    root.querySelector("#s21-events").innerHTML = `<span>WIRE EVENTS</span><p>Send immediately → ${reorder.checked ? "datagram 2 queues longer → " : ""}${lose.checked ? "datagram 3 disappears → " : ""}${appAction}</p>`;
    root.querySelector("#s21-receiver-note").textContent = reliable.checked ? "Application tracks message IDs" : "UDP tracks no conversation";
    send.textContent = "Send again";
  }
  count.addEventListener("input", markReady, { signal });
  [lose, reorder, reliable].forEach((control) => control.addEventListener("change", markReady, { signal }));
  send.addEventListener("click", simulate, { signal });
  markReady();
  return () => aborter.abort();
}
