const initialPorts = [10, 10, 20, 20, 10, 20];

export async function mount(root) {
  root.innerHTML = `
    <article class="demo-page s17-page">
      <header class="demo-header">
        <div><p class="eyebrow">Module 105.17 · VLAN switch lab</p><h1>One Switch, Separate Broadcast Domains</h1><p class="lede">Assign switch ports to VLANs, select a sender, and watch a Layer 2 broadcast stay inside its logical network.</p></div>
        <div class="concept-key"><span class="chip protocol">Layer 2</span><span class="chip data">Segmentation</span><span class="chip concept">Routing</span></div>
      </header>

      <section class="experiment-card s17-lab">
        <div class="s17-controls">
          <fieldset><legend>Selected port VLAN</legend><div class="s17-segment-buttons"><button type="button" data-vlan="10" aria-pressed="true">VLAN 10 · Operations</button><button type="button" data-vlan="20" aria-pressed="false">VLAN 20 · Finance</button></div></fieldset>
          <label><span>Traffic type</span><select id="s17-traffic"><option value="broadcast">Layer 2 broadcast</option><option value="unicast">Unicast to selected target</option></select></label>
          <label><span>Unicast target</span><select id="s17-target"></select></label>
          <label class="s17-router-toggle"><input id="s17-router" type="checkbox"><span><strong>Inter-VLAN router</strong><small>Permit routed unicast between VLANs</small></span></label>
          <button class="button primary" id="s17-send" type="button">Send frame</button>
        </div>

        <div class="s17-status" id="s17-status" aria-live="polite"><span>READY</span><strong>Port 1 is selected as the sender.</strong><p>Change the sender if needed, then send a frame.</p></div>

        <div class="s17-network" aria-label="Six devices connected to one managed switch">
          <div class="s17-device-grid" id="s17-devices"></div>
          <div class="s17-switch"><span>MANAGED SWITCH</span><strong>Layer 2 forwarding</strong><div><i class="s17-v10"></i> VLAN 10 <i class="s17-v20"></i> VLAN 20</div></div>
        </div>

        <div class="s17-readout">
          <article><span>PHYSICAL NETWORK</span><strong>1 managed switch</strong><p>All six endpoints share the same hardware.</p></article>
          <article><span>LOGICAL NETWORK</span><strong>2 broadcast domains</strong><p>VLAN membership, not physical position, defines each domain.</p></article>
          <article><span>BETWEEN VLANS</span><strong id="s17-route-state">Routing unavailable</strong><p>Different VLANs normally need a Layer 3 router or switch.</p></article>
        </div>
      </section>
    </article>`;

  const devices = ["Laptop A", "Printer", "Camera", "Payroll PC", "Laptop B", "NAS"];
  const ports = [...initialPorts];
  let sender = 0;
  let delivered = [];
  const board = root.querySelector("#s17-devices");
  const target = root.querySelector("#s17-target");
  const traffic = root.querySelector("#s17-traffic");
  const router = root.querySelector("#s17-router");
  const status = root.querySelector("#s17-status");
  const routeState = root.querySelector("#s17-route-state");

  function renderTargets() {
    const prior = target.value;
    target.innerHTML = devices.map((name, index) => index === sender ? "" : `<option value="${index}">${name} · VLAN ${ports[index]}</option>`).join("");
    if ([...target.options].some((option) => option.value === prior)) target.value = prior;
    target.disabled = traffic.value !== "unicast";
  }

  function renderDevices() {
    board.innerHTML = devices.map((name, index) => `
      <button type="button" class="s17-device s17-vlan-${ports[index]} ${index === sender ? "s17-sender" : ""} ${delivered.includes(index) ? "s17-delivered" : ""}" data-device="${index}" aria-pressed="${index === sender}">
        <span>PORT ${index + 1} · VLAN ${ports[index]}</span><strong>${name}</strong><small>${index === sender ? "Sender selected" : delivered.includes(index) ? "Frame received" : "Select as sender"}</small>
      </button>`).join("");
    root.querySelectorAll("[data-vlan]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.vlan) === ports[sender])));
    renderTargets();
  }

  function markReady(message) {
    delivered = [];
    status.className = "s17-status";
    status.innerHTML = `<span>READY</span><strong>${message}</strong><p>Send a frame to evaluate the current settings.</p>`;
    renderDevices();
  }

  function sendFrame() {
    const sourceVlan = ports[sender];
    if (traffic.value === "broadcast") {
      delivered = devices.map((_, index) => index).filter((index) => index !== sender && ports[index] === sourceVlan);
      status.className = "s17-status s17-ok";
      status.innerHTML = `<span>BROADCAST CONTAINED</span><strong>${devices[sender]} reached ${delivered.length} device${delivered.length === 1 ? "" : "s"} in VLAN ${sourceVlan}.</strong><p>Devices in the other VLAN did not receive this Layer 2 broadcast.</p>`;
    } else {
      const destination = Number(target.value);
      const sameVlan = ports[destination] === sourceVlan;
      const routed = !sameVlan && router.checked;
      delivered = sameVlan || routed ? [destination] : [];
      status.className = `s17-status ${delivered.length ? "s17-ok" : "s17-blocked"}`;
      status.innerHTML = delivered.length
        ? `<span>${routed ? "ROUTED AT LAYER 3" : "FORWARDED AT LAYER 2"}</span><strong>${devices[destination]} received the unicast.</strong><p>${routed ? `The router moved the packet from VLAN ${sourceVlan} to VLAN ${ports[destination]}.` : "Both endpoints are members of the same VLAN."}</p>`
        : `<span>NO LAYER 3 PATH</span><strong>The destination is in VLAN ${ports[destination]}.</strong><p>A switch does not bridge these logical broadcast domains; enable the router to route the unicast.</p>`;
    }
    renderDevices();
  }

  function chooseDevice(event) {
    const button = event.target.closest("[data-device]");
    if (!button) return;
    sender = Number(button.dataset.device);
    markReady(`${devices[sender]} is selected as the sender.`);
    root.querySelector(`[data-device="${sender}"]`)?.focus();
  }
  function assignVlan(event) {
    const button = event.target.closest("[data-vlan]");
    if (!button) return;
    ports[sender] = Number(button.dataset.vlan);
    delivered = [];
    renderDevices();
    status.className = "s17-status";
    status.innerHTML = `<span>PORT REASSIGNED</span><strong>Port ${sender + 1} now belongs to VLAN ${ports[sender]}.</strong><p>The endpoint changed logical broadcast domains without moving cables.</p>`;
  }
  board.addEventListener("click", chooseDevice);
  root.querySelector(".s17-segment-buttons").addEventListener("click", assignVlan);
  traffic.addEventListener("change", () => markReady("Traffic type changed."));
  target.addEventListener("change", () => markReady("Unicast target changed."));
  router.addEventListener("change", () => {
    routeState.textContent = router.checked ? "Routed unicast enabled" : "Routing unavailable";
    markReady(`Inter-VLAN routing ${router.checked ? "enabled" : "disabled"}.`);
  });
  root.querySelector("#s17-send").addEventListener("click", sendFrame);
  renderDevices();
  return () => {};
}
