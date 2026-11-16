const addressInfo = {
  ipv4: { label: "IPv4", bits: 32, address: "192.0.2.34", groups: ["192", "0", "2", "34"], min: 0, max: 32, prefix: 24, note: "Four decimal octets represent a 32-bit address." },
  ipv6: { label: "IPv6", bits: 128, address: "2001:db8:4a::34", groups: ["2001", "0db8", "004a", "0000", "0000", "0000", "0000", "0034"], min: 0, max: 128, prefix: 64, note: "Eight hexadecimal groups represent 128 bits; consecutive zero groups may be compressed with ::." },
};

export async function mount(root) {
  root.innerHTML = `
    <article class="demo-page s18-page">
      <header class="demo-header"><div><p class="eyebrow">Module 105.18 · IP address explorer</p><h1>Two Versions, Two Address Spaces</h1><p class="lede">Compare the size and notation of IPv4 and IPv6, then test how the versions coexist on real networks.</p></div><div class="concept-key"><span class="chip protocol">IPv4</span><span class="chip encoding">IPv6</span><span class="chip concept">Dual-stack</span></div></header>
      <section class="experiment-card s18-lab">
        <div class="s18-version" role="group" aria-label="IP version"><button type="button" data-version="ipv4" aria-pressed="true">IPv4 <small>32 bits</small></button><button type="button" data-version="ipv6" aria-pressed="false">IPv6 <small>128 bits</small></button></div>
        <div class="s18-address-panel">
          <div><span id="s18-label">IPv4 ADDRESS</span><strong id="s18-address"></strong><p id="s18-note"></p></div>
          <label><span>Network prefix <b id="s18-prefix-output">/24</b></span><input id="s18-prefix" type="range"><small>Colored bits identify the network prefix; remaining bits identify addresses inside it.</small></label>
        </div>
        <div class="s18-bits" id="s18-bits" aria-label="Address bit map"></div>
        <div class="s18-metrics"><article><span>ADDRESS LENGTH</span><strong id="s18-length"></strong></article><article><span>HOST / INTERFACE BITS</span><strong id="s18-host"></strong></article><article><span>VALUES IN PREFIX</span><strong id="s18-values"></strong></article><article><span>WRITTEN BASE</span><strong id="s18-base"></strong></article></div>
        <div class="s18-transition">
          <div><span>COEXISTENCE TEST</span><h2>Do these endpoints share an IP version?</h2><p>Choose the IP support on each endpoint. This isolates version compatibility; addressing, routing, and policy are assumed.</p></div>
          <label>Client<select id="s18-client"><option value="dual">Dual-stack</option><option value="v4">IPv4 only</option><option value="v6">IPv6 only</option></select></label>
          <label>Server<select id="s18-server"><option value="v6">IPv6 only</option><option value="dual">Dual-stack</option><option value="v4">IPv4 only</option></select></label>
          <div class="s18-result" id="s18-result" aria-live="polite"></div>
        </div>
      </section>
      <p class="s18-footnote">IPv4 has 2<sup>32</sup> possible address values (about 4.3 billion). IPv6 has 2<sup>128</sup>. Not every value is assignable to a host, and prefix size is not a count of usable hosts.</p>
    </article>`;

  let version = "ipv4";
  const slider = root.querySelector("#s18-prefix");
  const bits = root.querySelector("#s18-bits");
  function compactPower(power) {
    if (power <= 32) return Number(2 ** power).toLocaleString("en-US");
    return `2^${power} ≈ 10^${Math.floor(power * Math.LOG10E * Math.LN2)}`;
  }
  function render() {
    const info = addressInfo[version];
    const prefix = Number(slider.value);
    root.querySelector("#s18-label").textContent = `${info.label} ADDRESS`;
    root.querySelector("#s18-address").textContent = `${info.address}/${prefix}`;
    root.querySelector("#s18-note").textContent = info.note;
    root.querySelector("#s18-prefix-output").textContent = `/${prefix}`;
    root.querySelector("#s18-length").textContent = `${info.bits} bits`;
    root.querySelector("#s18-host").textContent = `${info.bits - prefix} bits`;
    root.querySelector("#s18-values").textContent = compactPower(info.bits - prefix);
    root.querySelector("#s18-base").textContent = version === "ipv4" ? "Decimal" : "Hexadecimal";
    bits.innerHTML = info.groups.map((group, groupIndex) => {
      const groupBits = version === "ipv4" ? 8 : 16;
      const start = groupIndex * groupBits;
      const networkWidth = Math.max(0, Math.min(groupBits, prefix - start)) / groupBits * 100;
      return `<div class="s18-group"><span>${group}</span><i><b style="width:${networkWidth}%"></b></i><small>${start + 1}–${start + groupBits}</small></div>`;
    }).join("");
  }
  function setVersion(next) {
    version = next;
    const info = addressInfo[version];
    slider.min = info.min; slider.max = info.max; slider.step = 1; slider.value = info.prefix;
    root.querySelectorAll("[data-version]").forEach((button) => { const active = button.dataset.version === version; button.classList.toggle("s18-active", active); button.setAttribute("aria-pressed", String(active)); });
    bits.classList.toggle("s18-ipv6", version === "ipv6");
    render();
  }
  function testCompatibility() {
    const client = root.querySelector("#s18-client").value;
    const server = root.querySelector("#s18-server").value;
    const supports = (choice, protocol) => choice === "dual" || choice === protocol;
    const shared = ["v4", "v6"].filter((protocol) => supports(client, protocol) && supports(server, protocol));
    const output = root.querySelector("#s18-result");
    output.className = `s18-result ${shared.length ? "s18-compatible" : "s18-incompatible"}`;
    output.innerHTML = shared.length
      ? `<span>COMPATIBLE VERSION AVAILABLE</span><strong>${shared.length === 2 ? "IPv4 and IPv6 are shared" : `Use ${shared[0] === "v4" ? "IPv4" : "IPv6"}`}</strong><small>${shared.length === 2 ? "A real dual-stack policy or name resolution result decides which version is preferred." : "Both endpoints support this IP version; reachability still depends on addressing, routing, and policy."}</small>`
      : `<span>NO SHARED IP VERSION</span><strong>Transition mechanism needed</strong><small>IPv4 and IPv6 are not directly interchangeable.</small>`;
  }
  root.querySelector(".s18-version").addEventListener("click", (event) => { const button = event.target.closest("[data-version]"); if (button) setVersion(button.dataset.version); });
  slider.addEventListener("input", render);
  root.querySelector("#s18-client").addEventListener("change", testCompatibility);
  root.querySelector("#s18-server").addEventListener("change", testCompatibility);
  setVersion(version); testCompatibility();
  return () => {};
}
