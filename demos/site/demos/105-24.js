function loadStyles() { if (!document.querySelector('link[data-m2328-styles]')) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "./demos/105-23-28.css"; l.dataset.m2328Styles = "true"; document.head.append(l); } }

const TERMS = {
  symmetric: { title: "Symmetric", job: "Protect bulk data with one shared secret", flow: ["Plaintext", "Shared key", "Ciphertext", "Same key", "Plaintext"], result: "Fast for large data; the shared key must be distributed and stored securely.", tone: "teal" },
  asymmetric: { title: "Asymmetric", job: "Use a related public/private key pair", flow: ["Message", "Public key", "Ciphertext", "Private key", "Message"], result: "Enables encryption, authentication, signatures, and key establishment without a pre-shared secret.", tone: "blue" },
  homomorphic: { title: "Homomorphic", job: "Compute while values remain encrypted", flow: ["Encrypt 4", "Encrypted + 3", "Encrypted result", "Decrypt", "7"], result: "Only supported computations are possible; decrypted output corresponds to computing on plaintext.", tone: "violet" },
  polymorphic: { title: "Polymorphic", job: "Change cryptographic elements over time", flow: ["Data", "Form A", "Rotate", "Form B", "Authorized access"], result: "An umbrella term, not one standardized primitive; designs may vary keys, algorithms, or representation.", tone: "amber" },
  hashing: { title: "Hashing", job: "Create a fixed-length, one-way digest", flow: ["Input", "Hash function", "Digest", "Change 1 bit", "Different digest"], result: "Useful for integrity checks; it is not encryption and has no decryption key.", tone: "amber" },
  signatures: { title: "Digital signatures", job: "Sign privately; verify publicly", flow: ["Data", "Private key signs", "Signature", "Public key verifies", "Valid / invalid"], result: "Supports integrity, signer authenticity, and properly managed non-repudiation.", tone: "violet" },
  certificates: { title: "Digital certificates", job: "Bind an identity to a public key", flow: ["Identity", "Public key", "Issuer signs", "Certificate", "Trust decision"], result: "A trusted CA or issuer signs the binding used by TLS, code signing, and secure email.", tone: "blue" },
  smime: { title: "S/MIME", job: "Sign and encrypt certificate-based email", flow: ["Email", "Sign", "Encrypt", "Recipient decrypts", "Verify"], result: "Can provide email confidentiality, integrity, sender authentication, and signature-based non-repudiation.", tone: "teal" },
};

export async function mount(root) {
  loadStyles();
  root.innerHTML = `<article class="m2328-page"><header class="m2328-header"><div><p class="m2328-kicker">Module 105.24 · Cryptographic terms</p><h1>Match the mechanism to the job</h1><p>Select a term and trace what enters, which key or function acts, and what security property emerges.</p></div><span class="m2328-badge">Crypto map</span></header>
  <section class="m2328-panel m2328-crypto"><div class="m2328-term-list" role="tablist" aria-label="Cryptographic terms">${Object.entries(TERMS).map(([key,t],n)=>`<button type="button" id="m2328-term-${key}" role="tab" aria-controls="m2328-crypto-panel" aria-selected="${n===0}" data-term="${key}"><span>${String(n+1).padStart(2,"0")}</span>${t.title}</button>`).join("")}</div>
  <div id="m2328-crypto-panel" class="m2328-crypto-stage" role="tabpanel" aria-live="polite"><header><span data-crypto-label></span><h2 data-crypto-title></h2><p data-crypto-job></p></header><div class="m2328-flow" data-flow></div><div class="m2328-property" data-result></div>
  <label class="m2328-message" hidden><span>Change the hashing example</span><input data-message value="MISSION REPORT" maxlength="28"><small data-fingerprint></small></label></div></section>
  <aside class="m2328-note"><strong>Key distinctions</strong><span>Encryption targets confidentiality; hashing targets a one-way digest; signatures target integrity and authenticity. Certificates bind identity to a public key.</span></aside></article>`;
  let active = "symmetric";
  const buttons = [...root.querySelectorAll("[data-term]")], input = root.querySelector("[data-message]");
  const listeners = [];
  const on=(e,t,f)=>{e.addEventListener(t,f);listeners.push(()=>e.removeEventListener(t,f));};
  function tinyHash(text) { let h=2166136261; for (const c of text) { h ^= c.codePointAt(0); h = Math.imul(h,16777619); } return (h>>>0).toString(16).padStart(8,"0").toUpperCase(); }
  function render() {
    const t=TERMS[active];
    buttons.forEach(b=>{ const a=b.dataset.term===active; b.setAttribute("aria-selected",String(a)); b.tabIndex=a?0:-1; });
    root.querySelector("#m2328-crypto-panel").setAttribute("aria-labelledby",`m2328-term-${active}`);
    root.querySelector("[data-crypto-label]").textContent=t.title.toUpperCase();
    root.querySelector("[data-crypto-title]").textContent=t.title;
    root.querySelector("[data-crypto-job]").textContent=t.job;
    root.querySelector("[data-flow]").innerHTML=t.flow.map((s,i)=>`<span><i>${i+1}</i><b>${s}</b></span>`).join('<em aria-hidden="true">→</em>');
    root.querySelector("[data-result]").innerHTML=`<span>KEY POINT</span><p>${t.result}</p>`;
    input.closest("label").hidden=active!=="hashing";
    root.querySelector("[data-fingerprint]").textContent=`Non-cryptographic teaching token: ${tinyHash(input.value)} · edit one character and compare`;
  }
  buttons.forEach((b,index)=>{on(b,"click",()=>{active=b.dataset.term;render();});on(b,"keydown",e=>{if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?buttons.length-1:(index+(e.key==="ArrowRight"?1:-1)+buttons.length)%buttons.length;buttons[next].focus();buttons[next].click();});});
  on(input,"input",render); render();
  return()=>listeners.splice(0).forEach(off=>off());
}
