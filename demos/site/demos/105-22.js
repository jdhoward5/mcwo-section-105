export async function mount(root) {
  root.innerHTML = `
    <article class="demo-page s22-page"><header class="demo-header"><div><p class="eyebrow">Module 105.22 · Session lifecycle console</p><h1>Communication sessions</h1><p class="lede">Choose how the session is established and maintained, then advance the simulation clock until it closes or times out.</p></div><div class="concept-key"><span class="chip protocol">Handshake</span><span class="chip data">Keepalive</span><span class="chip concept">Timeout</span></div></header>
      <section class="experiment-card s22-lab">
        <div class="s22-config">
          <label><span>Establishment</span><select id="s22-establish"><option value="handshake">Negotiated handshake</option><option value="implicit">Implicit first message</option></select><small>A handshake can negotiate identity, capabilities, encryption, and initial state.</small></label>
          <label><span>Maintenance</span><select id="s22-maintain"><option value="heartbeat">Heartbeat every 10 s</option><option value="activity">Application activity only</option><option value="token">Token + stored state</option></select><small>Maintenance methods detect peers or preserve conversational context.</small></label>
          <label><span>Idle timeout <b id="s22-timeout-out">30 s</b></span><input id="s22-timeout" type="range" min="15" max="60" value="30" step="5"><small>Inactivity past this limit expires the session.</small></label>
          <label class="s22-peer"><span>Heartbeat replies</span><input id="s22-peer" type="checkbox" checked><small>Turn replies off while active to simulate a peer that becomes unreachable.</small></label>
        </div>
        <div class="s22-state s22-closed" id="s22-state" aria-live="polite"><span>SESSION STATE</span><strong>Closed</strong><p>Configure the session, then establish it.</p></div>
        <div class="s22-lifecycle" aria-label="Session lifecycle"><div data-state="closed"><i>1</i><strong>Closed</strong><small>No state allocated</small></div><b>→</b><div data-state="opening"><i>2</i><strong>Opening</strong><small>Negotiate or infer</small></div><b>→</b><div data-state="active"><i>3</i><strong>Active</strong><small>Maintain state</small></div><b>→</b><div data-state="ended"><i>4</i><strong>Ended</strong><small>Close or expire</small></div></div>
        <div class="s22-clock"><div><span>SIMULATION CLOCK</span><strong id="s22-now">T+0 s</strong></div><div><span>IDLE FOR</span><strong id="s22-idle">0 s</strong></div><div><span>SESSION TOKEN</span><strong id="s22-token">None</strong></div></div>
        <div class="s22-actions"><button class="button primary" id="s22-open" type="button">Establish session</button><button class="button subtle" id="s22-advance" type="button" disabled>Advance 5 s</button><button class="button subtle" id="s22-activity" type="button" disabled>Send application data</button><button class="button subtle" id="s22-close" type="button" disabled>Explicit close</button><button class="button subtle" id="s22-reset" type="button">Reset</button></div>
        <ol class="s22-log" id="s22-log" aria-label="Session event log"></ol>
      </section>
      <div class="s22-methods"><article><span>SETUP COST</span><strong>Negotiation delays first use</strong><p>A handshake can establish shared state before application data, but it adds an exchange.</p></article><article><span>KEEPALIVE COST</span><strong>Detection uses traffic</strong><p>Frequent heartbeats notice an unreachable peer sooner while consuming more network and endpoint resources.</p></article><article><span>TIMEOUT CHOICE</span><strong>Cleanup versus continuity</strong><p>A short timeout releases abandoned state quickly but can end a legitimately idle session.</p></article></div>
    </article>`;
  let state = "closed", now = 0, lastActivity = 0, endedIdle = 0, nextHeartbeat = 10, events = [];
  const establish = root.querySelector("#s22-establish"), maintain = root.querySelector("#s22-maintain"), timeout = root.querySelector("#s22-timeout"), peer = root.querySelector("#s22-peer");
  const stateBox = root.querySelector("#s22-state"), open = root.querySelector("#s22-open"), advance = root.querySelector("#s22-advance"), activity = root.querySelector("#s22-activity"), close = root.querySelector("#s22-close");
  function addEvent(label, detail) { events.unshift({ time: now, label, detail }); events = events.slice(0, 8); }
  function render() {
    const idle = state === "active" ? now - lastActivity : state === "ended" ? endedIdle : 0;
    stateBox.className = `s22-state s22-${state}`;
    const messages = { closed: ["Closed", "Configure the session, then establish it."], opening: ["Opening", "Endpoints are negotiating initial state."], active: ["Active", `Session state is maintained; ${idle} seconds idle.`], ended: ["Ended", events[0]?.detail || "Session state released."] };
    stateBox.innerHTML = `<span>SESSION STATE</span><strong>${messages[state][0]}</strong><p>${messages[state][1]}</p>`;
    root.querySelectorAll(".s22-lifecycle [data-state]").forEach((node) => node.classList.toggle("s22-current", node.dataset.state === state));
    root.querySelector("#s22-now").textContent = `T+${now} s`;
    root.querySelector("#s22-idle").textContent = `${idle} s`;
    root.querySelector("#s22-token").textContent = state === "active" && maintain.value === "token" ? "SESSION-10522" : "None";
    const active = state === "active";
    open.disabled = state === "active";
    open.textContent = state === "opening" ? establish.value === "handshake" ? "Complete handshake" : "Deliver first message" : state === "ended" ? "Establish new session" : "Establish session";
    advance.disabled = !active; activity.disabled = !active; close.disabled = !active;
    [establish, maintain, timeout].forEach((control) => { control.disabled = active || state === "opening"; });
    peer.disabled = maintain.value !== "heartbeat" || state === "opening";
    root.querySelector("#s22-log").innerHTML = events.map((event) => `<li><time>T+${event.time} s</time><strong>${event.label}</strong><p>${event.detail}</p></li>`).join("") || `<li class="s22-empty">No session events yet.</li>`;
  }
  function openSession() {
    if (state !== "opening") {
      if (state === "ended") { now = 0; events = []; endedIdle = 0; }
      state = "opening";
      addEvent(establish.value === "handshake" ? "Handshake started" : "First message sent", establish.value === "handshake" ? "The endpoints are negotiating identity, capabilities, encryption, and initial state." : "The receiver has not allocated session state until this first message arrives.");
      render();
      return;
    }
    if (establish.value === "handshake") addEvent("Handshake complete", "Client hello → server negotiation → client acknowledgment completed.");
    else addEvent("Implicit establishment", "The first application message arrived and caused the receiver to allocate session state.");
    state = "active"; lastActivity = now; nextHeartbeat = now + 10; addEvent("Session active", maintain.value === "token" ? "A deterministic token now identifies stored session state." : "Both endpoints can now exchange application data."); render();
  }
  function advanceClock() {
    now += 5;
    if (maintain.value === "heartbeat" && now >= nextHeartbeat) {
      nextHeartbeat += 10;
      if (peer.checked) { lastActivity = now; addEvent("Heartbeat reply", "The peer answered the keepalive and reset the idle timer."); }
      else addEvent("Heartbeat missed", "No reply arrived, so the idle timer continued toward expiration.");
    }
    if (now - lastActivity >= Number(timeout.value)) { endedIdle = now - lastActivity; state = "ended"; addEvent("Idle timeout", `No activity arrived within ${timeout.value} seconds; stored session state expired.`); }
    render();
  }
  function sendActivity() { lastActivity = now; addEvent("Application data", maintain.value === "token" ? "The request presented SESSION-10522 and refreshed stored state." : "Sequence/acknowledgment state advanced and the idle timer reset."); render(); }
  function explicitClose() { endedIdle = now - lastActivity; state = "ended"; addEvent("Explicit close", "The endpoints exchanged a close indication and released session state."); render(); }
  function reset() { state = "closed"; now = 0; lastActivity = 0; endedIdle = 0; nextHeartbeat = 10; events = []; peer.checked = true; [establish, maintain, timeout].forEach((control) => { control.disabled = false; }); render(); }
  timeout.addEventListener("input", () => { root.querySelector("#s22-timeout-out").textContent = `${timeout.value} s`; render(); });
  maintain.addEventListener("change", render);
  peer.addEventListener("change", () => { if (state === "active") addEvent(peer.checked ? "Peer restored" : "Peer silent", peer.checked ? "Future heartbeat replies can refresh the session." : "Future heartbeat probes will receive no reply."); render(); });
  open.addEventListener("click", openSession); advance.addEventListener("click", advanceClock); activity.addEventListener("click", sendActivity); close.addEventListener("click", explicitClose); root.querySelector("#s22-reset").addEventListener("click", reset);
  reset();
  return () => {};
}
