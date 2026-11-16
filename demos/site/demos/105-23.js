function loadStyles() {
  if (document.querySelector('link[data-m2328-styles]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./demos/105-23-28.css";
  link.dataset.m2328Styles = "true";
  document.head.append(link);
}

export async function mount(root) {
  loadStyles();
  root.innerHTML = `
    <article class="m2328-page">
      <header class="m2328-header">
        <div><p class="m2328-kicker">Module 105.23 · Interactive</p><h1>Communication media</h1>
        <p>Compare how a wireless radio link and a wired cable respond to distance, obstacles, interference, mobility, and installation constraints.</p></div>
        <span class="m2328-badge">Signal path lab</span>
      </header>
      <section class="m2328-panel m2328-media-lab">
        <div class="m2328-controls" aria-label="Link conditions">
          <fieldset class="m2328-media-scenarios">
            <legend>Try a scenario</legend>
            <div>
              <button type="button" data-scenario="mobile" aria-pressed="true">Mobile team</button>
              <button type="button" data-scenario="office" aria-pressed="false">Fixed office</button>
              <button type="button" data-scenario="retrofit" aria-pressed="false">Difficult retrofit</button>
              <button type="button" data-scenario="rf" aria-pressed="false">Harsh RF site</button>
            </div>
          </fieldset>
          <label><span>Distance <output data-out="distance">30 m</output></span><input data-control="distance" type="range" min="10" max="100" value="30" step="10"></label>
          <label><span>Number of obstacles <output data-out="obstacles">1</output></span><input data-control="obstacles" type="range" min="0" max="5" value="1"><small>Walls or similar signal barriers in this simplified model</small></label>
          <label><span>Radio interference <output data-out="interference">20%</output></span><input data-control="interference" type="range" min="0" max="100" value="20" step="10"></label>
          <label><span>Mobility required <output data-out="mobility">Yes</output></span><input data-control="mobility" type="checkbox" role="switch" checked></label>
          <label><span>Cable installation possible <output data-out="install">Yes</output></span><input data-control="install" type="checkbox" role="switch" checked></label>
        </div>
        <div class="m2328-media-stage">
          <div class="m2328-room" data-room>
            <span class="m2328-endpoint">A</span>
            <svg class="m2328-path m2328-wireless-path" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><g><line x1="0" y1="10" x2="100" y2="10" vector-effect="non-scaling-stroke"/><ellipse cx="50" cy="10" rx="20" ry="9" vector-effect="non-scaling-stroke"/></g></svg>
            <svg class="m2328-path m2328-wired-path" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><g><line class="m2328-cable-outline" x1="0" y1="4" x2="100" y2="4" vector-effect="non-scaling-stroke"/><line x1="0" y1="4" x2="100" y2="4" vector-effect="non-scaling-stroke"/></g></svg>
            <span class="m2328-endpoint">B</span>
          </div>
          <div class="m2328-media-cards">
            <article data-medium="wireless"><header><span>WIRELESS FIT</span><strong data-score="wireless">—</strong></header><div class="m2328-meter"><i></i></div><p data-detail="wireless"></p><ul><li>Free-space electromagnetic signal</li><li>Mobility and flexible deployment</li><li>Shared spectrum requires strong encryption</li></ul></article>
            <article data-medium="wired"><header><span>WIRED FIT</span><strong data-score="wired">—</strong></header><div class="m2328-meter"><i></i></div><p data-detail="wired"></p><ul><li>Copper, coaxial, or fiber cable</li><li>Predictable, physically contained path</li><li>Ports, damage, cost, and distance still matter</li></ul></article>
          </div>
          <div class="m2328-verdict" data-verdict></div>
          <p class="sr-only" data-status aria-live="polite" aria-atomic="true"></p>
        </div>
      </section>
      <aside class="m2328-note"><strong>Model limits</strong><span>Scores are a teaching comparison, not measured throughput. Real link quality also depends on equipment, medium type, protocols, and environment.</span></aside>
    </article>`;

  const controls = Object.fromEntries([...root.querySelectorAll("[data-control]")].map((el) => [el.dataset.control, el]));
  const scenarios = {
    mobile: { distance: 30, obstacles: 1, interference: 20, mobility: true, install: true },
    office: { distance: 30, obstacles: 1, interference: 20, mobility: false, install: true },
    retrofit: { distance: 50, obstacles: 2, interference: 20, mobility: false, install: false },
    rf: { distance: 70, obstacles: 4, interference: 80, mobility: false, install: true },
  };
  const scenarioButtons = [...root.querySelectorAll("[data-scenario]")];
  const listeners = [];
  let statusTimer = null;
  const on = (el, type, fn) => { el.addEventListener(type, fn); listeners.push(() => el.removeEventListener(type, fn)); };
  function render() {
    const d = Number(controls.distance.value), o = Number(controls.obstacles.value), i = Number(controls.interference.value);
    const mobile = controls.mobility.checked, install = controls.install.checked;
    const wireless = Math.max(5, Math.min(100, 94 - d * .22 - o * 8 - i * .36 + (mobile ? 18 : 0)));
    const wired = install ? Math.max(25, Math.min(100, 96 - d * .08 + (mobile ? -34 : 0))) : null;
    root.querySelector('[data-out="distance"]').textContent = `${d} m`;
    root.querySelector('[data-out="obstacles"]').textContent = o;
    root.querySelector('[data-out="interference"]').textContent = `${i}%`;
    root.querySelector('[data-out="mobility"]').textContent = mobile ? "Yes" : "No";
    root.querySelector('[data-out="install"]').textContent = install ? "Yes" : "No";
    root.querySelector("[data-room]").style.setProperty("--m2328-gap", Math.min(82, 30 + d * .5) / 100);
    const difference = wired === null ? Infinity : Math.abs(wireless - wired);
    const winner = wired === null ? "Wireless" : difference < 6 ? "Close tradeoff" : wireless > wired ? "Wireless" : "Wired";
    [["wireless", wireless], ["wired", wired]].forEach(([name, score]) => {
      const card = root.querySelector(`[data-medium="${name}"]`);
      card.querySelector(`[data-score="${name}"]`).textContent = score === null ? "Unavailable" : `${Math.round(score)}/100`;
      // Translate inside the clipped track to retain the fill's rounded caps.
      card.querySelector(".m2328-meter i").style.transform = `translateX(${(score ?? 0) - 100}%)`;
      card.classList.toggle("m2328-best", winner === "Close tradeoff" || winner.toLowerCase() === name);
      card.classList.toggle("m2328-unavailable", score === null);
    });
    root.querySelector('[data-detail="wireless"]').textContent = i > 60 ? "High interference reduces wireless reliability." : o > 3 ? "Several obstacles reduce signal strength." : mobile ? "Wireless supports endpoint movement within coverage." : "Wireless performance depends on the shared radio environment.";
    root.querySelector('[data-detail="wired"]').textContent = !install ? "No physical route is available, so the cable cannot serve this case." : mobile ? "The cable contains the path but restricts endpoint movement." : d > 80 ? "Distance may require the right cable type or intermediate equipment." : "A stable physical path under these conditions.";
    const reason = winner === "Wireless"
      ? mobile ? "The endpoints must move, so wireless is the better fit despite reduced reliability." : wireless < 25 ? "Wireless is the only available path, but its low fit score flags serious radio-frequency risk that the design must address." : "A cable route is unavailable, so wireless is the viable fit despite environmental limitations."
      : winner === "Wired"
        ? "A cable route is available and the fixed endpoints benefit from a contained, predictable path."
        : "The modeled fit is close. Revisit mobility, installation feasibility, security, capacity, and cost before choosing.";
    root.querySelector("[data-verdict]").innerHTML = `<span>${winner === "Close tradeoff" ? "NO AUTOMATIC WINNER" : "BEST FIT FOR THESE INPUTS"}</span><strong>${winner}</strong><p>${reason}</p>`;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      if (!root.isConnected) return;
      root.querySelector("[data-status]").textContent = `${winner}. Wireless fit ${Math.round(wireless)} out of 100. Wired fit ${wired === null ? "unavailable" : `${Math.round(wired)} out of 100`}.`;
    }, 250);
  }
  Object.values(controls).forEach((el) => on(el, "input", () => {
    scenarioButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
    render();
  }));
  scenarioButtons.forEach((button) => on(button, "click", () => {
    const values = scenarios[button.dataset.scenario];
    for (const [name, value] of Object.entries(values)) {
      if (controls[name].type === "checkbox") controls[name].checked = value;
      else controls[name].value = value;
    }
    scenarioButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
    render();
  }));
  render();
  return () => {
    window.clearTimeout(statusTimer);
    listeners.splice(0).forEach((off) => off());
  };
}
