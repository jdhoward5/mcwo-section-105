export async function mount(root) {
  root.innerHTML = `
    <article class="demo-page s19-page">
      <header class="demo-header"><div><p class="eyebrow">Module 105.19 · Network performance lab</p><h1>Fast Response Is Not the Same as Fast Transfer</h1><p class="lede">Change latency, throughput, payload size, and overhead to see which factor dominates a network task.</p></div><div class="concept-key"><span class="chip algorithm">Latency</span><span class="chip data">Throughput</span><span class="chip concept">Goodput</span></div></header>
      <section class="experiment-card s19-lab">
        <div class="s19-controls">
          <label><span>Round-trip latency <b id="s19-latency-out">80 ms</b></span><input id="s19-latency" type="range" min="5" max="500" value="80" step="5"><small>Time for a request and response to make a round trip.</small></label>
          <label><span>Measured throughput <b id="s19-rate-out">40 Mbps</b></span><input id="s19-rate" type="range" min="1" max="200" value="40"><small>Successfully transferred bits per second in this model.</small></label>
          <label><span>Application payload <b id="s19-payload-out">10 MB</b></span><input id="s19-payload" type="range" min="1" max="100" value="10"><small>Useful data requested by the application.</small></label>
          <label><span>Protocol overhead <b id="s19-overhead-out">8%</b></span><input id="s19-overhead" type="range" min="0" max="30" value="8"><small>Transferred bits that are not useful application payload.</small></label>
        </div>
        <div class="s19-summary" id="s19-summary" aria-live="polite"></div>
        <div class="s19-timeline">
          <div class="s19-track"><i id="s19-wait-bar"><span>1 RTT startup</span></i><b id="s19-transfer-bar"><span>Payload transfer</span></b></div>
          <div class="s19-scale"><span>0 s</span><strong id="s19-total-scale"></strong></div>
        </div>
        <div class="s19-metrics">
          <article><span>LATENCY</span><strong id="s19-rtt"></strong><p>Delay before useful transfer begins in this one-RTT model.</p></article>
          <article><span>THROUGHPUT</span><strong id="s19-throughput"></strong><p>Rate of successfully transferred bits, including overhead.</p></article>
          <article><span>GOODPUT</span><strong id="s19-goodput"></strong><p>Rate of useful application payload after overhead.</p></article>
          <article><span>COMPLETION TIME</span><strong id="s19-total"></strong><p>One RTT plus payload bits divided by goodput.</p></article>
        </div>
        <div class="s19-comparison"><button type="button" data-preset="responsive" aria-pressed="false">Small interactive request</button><button type="button" data-preset="bulk" aria-pressed="false">Large bulk transfer</button><button type="button" data-preset="congested" aria-pressed="false">Congested path</button><p id="s19-insight"></p></div>
      </section>
      <p class="s19-scope">Illustrative deterministic model: completion = one round-trip delay + payload transfer time. Real protocols may need more round trips and are affected by congestion, loss, endpoint performance, and flow control.</p>
    </article>`;
  const latency = root.querySelector("#s19-latency");
  const rate = root.querySelector("#s19-rate");
  const payload = root.querySelector("#s19-payload");
  const overhead = root.querySelector("#s19-overhead");
  function formatSeconds(value) { return value < 1 ? `${Math.round(value * 1000)} ms` : `${value.toFixed(value < 10 ? 2 : 1)} s`; }
  function render() {
    const rttMs = Number(latency.value), mbps = Number(rate.value), payloadMb = Number(payload.value), overheadPercent = Number(overhead.value);
    const goodput = mbps * (1 - overheadPercent / 100);
    const transferSeconds = payloadMb * 8 / goodput;
    const totalSeconds = rttMs / 1000 + transferSeconds;
    const latencyShare = rttMs / 1000 / totalSeconds * 100;
    root.querySelector("#s19-latency-out").textContent = `${rttMs} ms`;
    root.querySelector("#s19-rate-out").textContent = `${mbps} Mbps`;
    root.querySelector("#s19-payload-out").textContent = `${payloadMb} MB`;
    root.querySelector("#s19-overhead-out").textContent = `${overheadPercent}%`;
    root.querySelector("#s19-rtt").textContent = `${rttMs} ms RTT`;
    root.querySelector("#s19-throughput").textContent = `${mbps.toFixed(1)} Mbps`;
    root.querySelector("#s19-goodput").textContent = `${goodput.toFixed(1)} Mbps`;
    root.querySelector("#s19-total").textContent = formatSeconds(totalSeconds);
    root.querySelector("#s19-total-scale").textContent = `${formatSeconds(totalSeconds)} total`;
    root.querySelector("#s19-wait-bar").style.width = `${latencyShare}%`;
    root.querySelector("#s19-transfer-bar").style.width = `${100 - latencyShare}%`;
    const dominant = latencyShare > 50 ? "Latency dominates this small or slow-starting task." : "Transfer time dominates this payload.";
    root.querySelector("#s19-summary").innerHTML = `<span>${latencyShare > 50 ? "MOSTLY LATENCY" : "MOSTLY TRANSFER TIME"}</span><strong>${dominant}</strong><p>${overheadPercent}% overhead lowers useful goodput from ${mbps} to ${goodput.toFixed(1)} Mbps.</p>`;
    root.querySelector("#s19-insight").textContent = latencyShare > 50 ? "Round-trip delay is the larger share of this task; reducing latency changes completion time most." : "Payload transfer is the larger share; throughput and goodput change completion time most.";
  }
  const presetButtons = [...root.querySelectorAll("[data-preset]")];
  const presets = { responsive: [100, 200, 1, 2], bulk: [40, 150, 60, 6], congested: [280, 8, 20, 18] };
  [latency, rate, payload, overhead].forEach((input) => input.addEventListener("input", () => { presetButtons.forEach((button) => button.setAttribute("aria-pressed", "false")); render(); }));
  root.querySelector(".s19-comparison").addEventListener("click", (event) => { const button = event.target.closest("[data-preset]"); if (!button) return; [latency.value, rate.value, payload.value, overhead.value] = presets[button.dataset.preset]; presetButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button))); render(); });
  render();
  return () => {};
}
