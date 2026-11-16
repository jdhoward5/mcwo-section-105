const layers = [
  { n: 7, name: "Application", pdu: "Data", job: "Provides network services to software.", send: "The browser creates an HTTP request.", receive: "The browser receives and interprets the HTTP response data." },
  { n: 6, name: "Presentation", pdu: "Data", job: "Translates, encodes, formats, or encrypts data.", send: "Text encoding and TLS representation prepare the data.", receive: "The receiver decrypts or decodes the representation for the application." },
  { n: 5, name: "Session", pdu: "Data", job: "Establishes, manages, and ends conversations.", send: "Conversation state is maintained between endpoints.", receive: "The receiver associates the data with the active conversation." },
  { n: 4, name: "Transport", pdu: "Segment", job: "Provides end-to-end delivery and multiplexing.", send: "TCP adds ports, sequencing, and delivery controls.", receive: "TCP validates sequencing, uses the ports to deliver data, and removes its header." },
  { n: 3, name: "Network", pdu: "Packet", job: "Addresses and routes traffic between networks.", send: "IP adds source and destination addresses.", receive: "IP confirms the destination and removes the network-layer header." },
  { n: 2, name: "Data Link", pdu: "Frame", job: "Moves frames over one local link.", send: "Ethernet adds local-link addresses and error detection.", receive: "Ethernet checks the frame, reads its local address, and removes the link header and trailer." },
  { n: 1, name: "Physical", pdu: "Bits", job: "Transmits bits as signals over a medium.", send: "The interface emits electrical, optical, or radio signals.", receive: "The receiving interface detects the signals and recovers the transmitted bits." },
];

function ensureStyle() { if (document.querySelector('link[data-mcwo1116-style]')) return; const l=document.createElement("link"); l.rel="stylesheet"; l.href="/demos/105-11-16.css"; l.dataset.mcwo1116Style="true"; document.head.append(l); }

export async function mount(root) {
  ensureStyle();
  root.innerHTML = `<article class="demo-page mcwo1116-page mcwo1116-osi"><header class="demo-header"><div><p class="eyebrow">Module 105.13 · OSI stack explorer</p><h1>One Message, Seven Jobs</h1><p class="lede">Send a web request down the conceptual OSI stack. Each layer serves the one above and uses the one below.</p></div></header>
    <section class="mcwo1116-card"><div class="mcwo1116-osi-toolbar"><div><span>DIRECTION</span><strong id="mcwo1116-osi-direction">Encapsulation · sender</strong></div><div class="mcwo1116-button-row"><button type="button" id="mcwo1116-osi-next">Move down one layer</button><button type="button" id="mcwo1116-osi-reverse">Reverse at receiver</button><button type="button" id="mcwo1116-osi-reset">Reset</button></div></div>
      <div class="mcwo1116-osi-workspace"><div class="mcwo1116-osi-stack" id="mcwo1116-osi-stack" aria-label="OSI layers"></div><section class="mcwo1116-osi-inspector" aria-live="polite"><span id="mcwo1116-osi-number"></span><h2 id="mcwo1116-osi-name"></h2><p id="mcwo1116-osi-job"></p><div class="mcwo1116-pdu"><small>Protocol data unit</small><strong id="mcwo1116-osi-pdu"></strong></div><div class="mcwo1116-feedback" id="mcwo1116-osi-action"></div></section></div>
      <div class="mcwo1116-envelope" aria-label="Encapsulation representation"><span>APPLICATION DATA</span><span id="mcwo1116-transport-header">L4 HEADER</span><span id="mcwo1116-network-header">L3 HEADER</span><span id="mcwo1116-link-header">L2 HEADER + TRAILER</span><i id="mcwo1116-bits">TRANSMITTED AS BITS</i></div>
    </section>
    <p class="mcwo1116-scope">The OSI model is conceptual: real protocols do not always map perfectly to one layer. “Data,” “segment,” “packet,” “frame,” and “bits” label the representation at different stages.</p>
  </article>`;
  const aborter = new AbortController(); const signal = aborter.signal; let index = 0; let descending = true;
  function render() {
    const current = layers[index];
    root.querySelector("#mcwo1116-osi-stack").innerHTML = layers.map((layer, i) => `<button type="button" data-layer="${i}" class="${i === index ? "active" : ""}" aria-current="${i === index ? "step" : "false"}"><i>${layer.n}</i><strong>${layer.name}</strong><small>${layer.pdu}</small></button>`).join("");
    root.querySelector("#mcwo1116-osi-number").textContent = `LAYER ${current.n}`;
    root.querySelector("#mcwo1116-osi-name").textContent = current.name;
    root.querySelector("#mcwo1116-osi-job").textContent = current.job;
    root.querySelector("#mcwo1116-osi-pdu").textContent = current.pdu;
    root.querySelector("#mcwo1116-osi-action").innerHTML = `<strong>${descending ? "Sender adds context" : "Receiver interprets and removes context"}</strong><p>${descending ? current.send : current.receive}</p>`;
    root.querySelector("#mcwo1116-osi-direction").textContent = descending ? "Encapsulation · sender" : "Decapsulation · receiver";
    root.querySelector("#mcwo1116-osi-next").disabled = descending ? index === layers.length - 1 : index === 0;
    root.querySelector("#mcwo1116-osi-next").textContent = descending ? "Move down one layer" : "Move up one layer";
    root.querySelector("#mcwo1116-osi-reverse").disabled = descending ? index !== layers.length - 1 : index !== 0;
    root.querySelector("#mcwo1116-osi-reverse").textContent = descending ? "Reverse at receiver" : "Send another request";
    root.querySelector("#mcwo1116-transport-header").classList.toggle("visible", index >= 3);
    root.querySelector("#mcwo1116-network-header").classList.toggle("visible", index >= 4);
    root.querySelector("#mcwo1116-link-header").classList.toggle("visible", index >= 5);
    root.querySelector("#mcwo1116-bits").classList.toggle("visible", index === 6);
    root.querySelectorAll("[data-layer]").forEach(b => b.addEventListener("click", () => { index=Number(b.dataset.layer); render(); root.querySelector(`[data-layer="${index}"]`)?.focus(); }, { signal, once: true }));
  }
  root.querySelector("#mcwo1116-osi-next").addEventListener("click", () => { index += descending ? 1 : -1; render(); }, { signal });
  root.querySelector("#mcwo1116-osi-reverse").addEventListener("click", () => { descending=!descending; index=descending ? 0 : 6; render(); }, { signal });
  root.querySelector("#mcwo1116-osi-reset").addEventListener("click", () => { descending=true; index=0; render(); }, { signal });
  render(); return () => aborter.abort();
}
