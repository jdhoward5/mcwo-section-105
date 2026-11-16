function loadStyles() { if (!document.querySelector('link[data-m2328-styles]')) { const l=document.createElement("link"); l.rel="stylesheet"; l.href="./demos/105-23-28.css"; l.dataset.m2328Styles="true"; document.head.append(l); } }

export async function mount(root) {
  loadStyles();
  root.innerHTML=`<article class="m2328-page"><header class="m2328-header"><div><p class="m2328-kicker">Module 105.25 · Interactive</p><h1>Steganography</h1><p>Embed message bits in the least-significant bits of an illustrative image grid, then inspect what an observer and an analyst can see.</p></div><span class="m2328-badge">Bit-plane model</span></header>
  <section class="m2328-panel m2328-stego"><div class="m2328-stego-controls"><label><span>Secret message</span><input data-secret value="OK" maxlength="3" aria-describedby="m2328-capacity"><small id="m2328-capacity">Capacity: 3 ASCII characters (24 bits)</small></label><fieldset><legend>View</legend><div class="m2328-segment"><button type="button" data-view="carrier" aria-pressed="true">Carrier</button><button type="button" data-view="bits" aria-pressed="false">Bit plane</button><button type="button" data-view="extract" aria-pressed="false">Extract</button></div></fieldset></div>
  <div class="m2328-stego-stage"><div class="m2328-pixels" data-pixels aria-hidden="true"></div><div class="m2328-stego-readout" aria-live="polite"><span data-state-label></span><h2 data-state-title></h2><p data-state-detail></p><div data-extracted></div></div></div>
  <div class="m2328-stego-compare"><article><span>ENCRYPTION</span><strong>Hides the content</strong><p>An observer may see ciphertext but cannot understand it without the key.</p></article><article><span>STEGANOGRAPHY</span><strong>Hides the presence</strong><p>An observer sees the carrier; the embedded message may still need encryption.</p></article></div></section>
  <aside class="m2328-note"><strong>Model limits</strong><span>Real steganography uses many carrier types and embedding strategies. This tiny bit-plane model demonstrates concealment, not a secure production technique.</span></aside></article>`;
  const input=root.querySelector("[data-secret]");
  const views=[...root.querySelectorAll("[data-view]")]; let view="carrier";
  const listeners=[]; const on=(e,t,f)=>{e.addEventListener(t,f);listeners.push(()=>e.removeEventListener(t,f));};
  function bitsFor(text){return [...text.padEnd(3," ").slice(0,3)].flatMap(c=>c.charCodeAt(0).toString(2).padStart(8,"0").split(""));}
  function render(){
    input.value=input.value.replace(/[^\x20-\x7E]/g,"?").slice(0,3);
    const text=input.value.slice(0,3), bits=bitsFor(text);
    views.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.view===view)));
    root.querySelector("[data-pixels]").className=`m2328-pixels m2328-view-${view}`;
    root.querySelector("[data-pixels]").innerHTML=bits.map((bit,i)=>{const base=70+((i*37)%130), changed=(base%2)!==Number(bit), value=base-(base%2)+Number(bit);return `<span style="--m2328-p:${value}" class="${changed?"m2328-changed":""}"><b>${view==="carrier"?"":bit}</b><small>${view==="bits"?value:""}</small></span>`;}).join("");
    const changed=bits.filter((b,i)=>(70+((i*37)%130))%2!==Number(b)).length;
    if(view==="carrier") { root.querySelector("[data-state-label]").textContent="CASUAL OBSERVER";root.querySelector("[data-state-title]").textContent="The carrier looks ordinary";root.querySelector("[data-state-detail]").textContent=`${changed} of 24 sample values shifted by only one level—too subtle to show in this normal view.`;root.querySelector("[data-extracted]").textContent="Hidden message not apparent"; }
    if(view==="bits") { root.querySelector("[data-state-label]").textContent="BIT-PLANE INSPECTION";root.querySelector("[data-state-title]").textContent="The low-order pattern becomes visible";root.querySelector("[data-state-detail]").textContent="Highlighted cells were adjusted so their least-significant bit carries the message stream.";root.querySelector("[data-extracted]").textContent=bits.join("").replace(/(.{8})/g,"$1 "); }
    if(view==="extract") { root.querySelector("[data-state-label]").textContent="MESSAGE EXTRACTION";root.querySelector("[data-state-title]").textContent=`Recovered: “${text || " "}”`;root.querySelector("[data-state-detail]").textContent="A recipient who knows the embedding rule reads the agreed bit positions and reconstructs three 8-bit character codes. Detection by an analyst is a separate problem.";root.querySelector("[data-extracted]").textContent=`Embedded bits: ${bits.join("").replace(/(.{8})/g,"$1 ")}`; }
  }
  views.forEach(b=>on(b,"click",()=>{view=b.dataset.view;render();})); on(input,"input",render);render();
  return()=>listeners.splice(0).forEach(off=>off());
}
