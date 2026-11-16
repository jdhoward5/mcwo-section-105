const tcpLayers = [
  { id: "application", name: "Application", job: "User-facing network protocols and application data", osi: "OSI 5–7", examples: ["HTTP", "DNS", "SMTP", "TLS"] },
  { id: "transport", name: "Transport", job: "End-to-end communication and process addressing", osi: "OSI 4", examples: ["TCP", "UDP"] },
  { id: "internet", name: "Internet", job: "Addressing and routing packets across networks", osi: "OSI 3", examples: ["IPv4", "IPv6", "ICMP"] },
  { id: "link", name: "Link", job: "Local-network delivery over the physical medium", osi: "OSI 1–2", examples: ["Ethernet", "Wi-Fi", "ARP"] },
];
const challenges = [
  { protocol: "DNS", correct: "application", detail: "DNS is an application-layer naming protocol, even when it uses UDP or TCP below." },
  { protocol: "TCP", correct: "transport", detail: "TCP provides reliable, ordered end-to-end byte-stream delivery." },
  { protocol: "IPv6", correct: "internet", detail: "IPv6 supplies Internet-layer addressing and packet routing." },
  { protocol: "Ethernet", correct: "link", detail: "Ethernet carries frames over a local link." },
];
function ensureStyle(){if(document.querySelector('link[data-mcwo1116-style]'))return;const l=document.createElement("link");l.rel="stylesheet";l.href="/demos/105-11-16.css";l.dataset.mcwo1116Style="true";document.head.append(l);}

export async function mount(root) {
  ensureStyle();
  root.innerHTML = `<article class="demo-page mcwo1116-page mcwo1116-tcpip"><header class="demo-header"><div><p class="eyebrow">Module 105.14 · TCP/IP model mapper</p><h1>TCP/IP model</h1><p class="lede">Inspect how Internet protocols group into the TCP/IP model, compare the conceptual OSI mapping, then classify real protocol examples.</p></div></header>
    <section class="mcwo1116-card"><div class="mcwo1116-tcpip-map" id="mcwo1116-tcpip-map"></div><aside class="mcwo1116-tcpip-inspector" aria-live="polite"><span id="mcwo1116-tcpip-osi"></span><h2 id="mcwo1116-tcpip-name"></h2><p id="mcwo1116-tcpip-job"></p><div><small>EXAMPLES</small><p id="mcwo1116-tcpip-examples"></p></div></aside></section>
    <section class="mcwo1116-card mcwo1116-challenge"><header><span>CLASSIFICATION CHECK</span><h2>Where does <b id="mcwo1116-protocol"></b> belong?</h2><p>Choose a TCP/IP layer for immediate feedback.</p></header><div class="mcwo1116-choice-grid" id="mcwo1116-layer-choices"></div><div class="mcwo1116-feedback" id="mcwo1116-tcpip-feedback" tabindex="-1" aria-live="polite"><strong>Make a selection</strong><p>The protocol's job determines its layer.</p></div><button type="button" class="mcwo1116-action" id="mcwo1116-next-protocol">Next protocol</button></section>
    <p class="mcwo1116-scope">Some references split the TCP/IP Link layer into Data Link and Physical, producing a five-layer teaching model. Protocol boundaries can also overlap; this four-layer model follows the Section 105 definition.</p>
  </article>`;
  const aborter=new AbortController();const signal=aborter.signal;let selected="application";let challenge=0;let answered=false;
  function renderMap(){
    const focusedLayer=root.ownerDocument.activeElement?.dataset?.tcpLayer;
    root.querySelector("#mcwo1116-tcpip-map").innerHTML=tcpLayers.map((layer,i)=>`<button type="button" data-tcp-layer="${layer.id}" class="${selected===layer.id?"active":""}" aria-pressed="${selected===layer.id}"><i>${i+1}</i><span><strong>${layer.name}</strong><small>${layer.osi}</small></span><b>${layer.examples.slice(0,2).join(" · ")}</b></button>`).join("");
    const layer=tcpLayers.find(x=>x.id===selected);root.querySelector("#mcwo1116-tcpip-osi").textContent=`MAPS APPROXIMATELY TO ${layer.osi}`;root.querySelector("#mcwo1116-tcpip-name").textContent=layer.name;root.querySelector("#mcwo1116-tcpip-job").textContent=layer.job;root.querySelector("#mcwo1116-tcpip-examples").textContent=layer.examples.join(" · ");
    root.querySelectorAll("[data-tcp-layer]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.tcpLayer;renderMap();},{signal,once:true}));
    if(focusedLayer)root.querySelector(`[data-tcp-layer="${focusedLayer}"]`)?.focus();
  }
  function renderChallenge(){
    const item=challenges[challenge];answered=false;root.querySelector("#mcwo1116-protocol").textContent=item.protocol;root.querySelector("#mcwo1116-layer-choices").innerHTML=tcpLayers.map(layer=>`<button type="button" data-answer="${layer.id}">${layer.name}</button>`).join("");root.querySelector("#mcwo1116-tcpip-feedback").className="mcwo1116-feedback";root.querySelector("#mcwo1116-tcpip-feedback").innerHTML="<strong>Make a selection</strong><p>The protocol's job determines its layer.</p>";root.querySelector("#mcwo1116-next-protocol").disabled=true;
    root.querySelectorAll("[data-answer]").forEach(b=>b.addEventListener("click",()=>{
      if(answered)return;answered=true;const correct=b.dataset.answer===item.correct;root.querySelectorAll("[data-answer]").forEach(c=>{c.disabled=true;c.classList.toggle("correct",c.dataset.answer===item.correct);c.classList.toggle("wrong",c===b&&!correct);});const feedback=root.querySelector("#mcwo1116-tcpip-feedback");feedback.className=`mcwo1116-feedback ${correct?"good":"bad"}`;feedback.innerHTML=`<strong>${correct?"Correct":"Not quite"}</strong><p>${item.detail}</p>`;root.querySelector("#mcwo1116-next-protocol").disabled=false;feedback.focus();
    },{signal,once:true}));
  }
  root.querySelector("#mcwo1116-next-protocol").addEventListener("click",()=>{challenge=(challenge+1)%challenges.length;renderChallenge();},{signal});renderMap();renderChallenge();return()=>aborter.abort();
}
