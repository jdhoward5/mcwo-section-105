function loadStyles() {
  if (document.querySelector("link[data-m2328-styles]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./demos/105-23-28.css";
  link.dataset.m2328Styles = "true";
  document.head.append(link);
}

const PERMISSIONS = {
  analyst: ["read:reports", "export:reports"],
  operator: ["read:reports", "restart:service"],
  admin: ["read:reports", "export:reports", "restart:service", "delete:records"],
};

const IDENTITIES = {
  avery: { name: "Avery Chen", role: "analyst" },
  morgan: { name: "Morgan Diaz", role: "operator" },
  priya: { name: "Priya Shah", role: "admin" },
  guest: { name: "Unregistered guest", role: null },
};

const CHECKS = [
  ["identify", "01", "IDENTITY", "Who is making the claim?"],
  ["authenticate", "02", "AUTHENTICATION", "Does the selected proof support the claim?"],
  ["authorize", "03", "AUTHORIZATION", "What may that identity do?"],
  ["enforce", "04", "ACCESS CONTROL", "Grant or deny under policy."],
];

export async function mount(root) {
  loadStyles();
  root.innerHTML = `
    <article class="m2328-page">
      <header class="m2328-header">
        <div>
          <p class="m2328-kicker">Module 105.27 · Interactive</p>
          <h1>Information security controls</h1>
          <p>Build a request and see identity, authentication, authorization, access control, and evidence make separate decisions.</p>
        </div>
        <span class="m2328-badge">Policy checkpoint</span>
      </header>

      <section class="m2328-panel m2328-access">
        <div class="m2328-access-controls">
          <label><span>Claimed identity</span><select data-identity><option value="avery">Avery Chen</option><option value="morgan">Morgan Diaz</option><option value="priya">Priya Shah</option><option value="guest">Unregistered guest</option></select></label>
          <label><span>Authentication proof</span><select data-proof><option value="password">Password only</option><option value="mfa">Password + security key</option><option value="none">No proof</option></select><small>This model assumes the selected proof is valid for the claimed registered account. It does not verify a real credential.</small></label>
          <div class="m2328-role"><span>Directory-assigned role</span><output data-role>Analyst</output><small>The requester cannot choose this trusted account attribute.</small></div>
          <label><span>Requested action</span><select data-action><option value="read:reports">Read reports</option><option value="export:reports">Export reports</option><option value="restart:service">Restart service</option><option value="delete:records">Delete records</option></select></label>
          <button type="button" data-submit>Evaluate request</button>
        </div>

        <div class="m2328-access-stage">
          <div class="m2328-checkpoints">
            ${CHECKS.map(([key, number, title, description]) => `<article data-check="${key}"><span>${number}</span><div><strong>${title}</strong><p>${description}</p></div><b>WAITING</b></article>`).join("")}
          </div>
          <div class="m2328-decision" data-decision aria-live="polite" aria-atomic="true"><span>REQUEST NOT YET EVALUATED</span><h2>Choose inputs and run the policy</h2></div>
          <div class="m2328-evidence" data-evidence></div>
        </div>
      </section>

      <aside class="m2328-note"><strong>Non-repudiation depends on evidence</strong><span>Digital signatures, trusted timestamps, and protected audit records can make a credible denial difficult. A plain application log alone does not guarantee non-repudiation.</span></aside>
    </article>
  `;

  const q = (selector) => root.querySelector(selector);
  const listeners = [];
  const on = (element, type, handler) => {
    element.addEventListener(type, handler);
    listeners.push(() => element.removeEventListener(type, handler));
  };
  let sequence = 0;

  function updateRole() {
    const principal = IDENTITIES[q("[data-identity]").value];
    q("[data-role]").textContent = principal.role
      ? principal.role[0].toUpperCase() + principal.role.slice(1)
      : "None";
  }

  function resetEvaluation() {
    CHECKS.forEach(([key, , , description]) => {
      const checkpoint = q(`[data-check="${key}"]`);
      checkpoint.className = "";
      checkpoint.querySelector("b").textContent = "WAITING";
      checkpoint.querySelector("p").textContent = description;
    });
    const decision = q("[data-decision]");
    decision.className = "m2328-decision";
    decision.innerHTML = "<span>REQUEST NOT YET EVALUATED</span><h2>Inputs changed—run the policy again</h2>";
    q("[data-evidence]").replaceChildren();
  }

  function setCheck(key, status, message) {
    const checkpoint = q(`[data-check="${key}"]`);
    checkpoint.className = status === "pass" ? "m2328-pass" : status === "blocked" ? "m2328-blocked" : "m2328-fail";
    checkpoint.querySelector("b").textContent = status === "pass" ? "PASS" : status === "blocked" ? "BLOCKED" : "STOP";
    checkpoint.querySelector("p").textContent = message;
  }

  function evaluate() {
    sequence += 1;
    const principal = IDENTITIES[q("[data-identity]").value];
    const identity = principal.name;
    const proof = q("[data-proof]").value;
    const role = principal.role;
    const action = q("[data-action]").value;
    const known = Boolean(role);
    const authenticated = known && proof !== "none";
    const strong = proof === "mfa";
    const permitted = known && PERMISSIONS[role].includes(action);
    const authorized = authenticated && permitted;

    setCheck("identify", known ? "pass" : "fail", known ? `Known identity: ${identity}` : "Identity not registered");
    setCheck("authenticate", !known ? "blocked" : authenticated ? "pass" : "fail", !known ? "Cannot check proof for an unknown identity" : authenticated ? `${strong ? "Two factors" : "One factor"} accepted in this model` : "No proof was presented");
    setCheck("authorize", !authenticated ? "blocked" : permitted ? "pass" : "fail", !authenticated ? "Not evaluated because authentication stopped the request" : permitted ? `${role} role permits this action` : `${role} role does not permit this action`);
    setCheck("enforce", authorized ? "pass" : "fail", authorized ? "Request granted" : "Request denied");

    const decision = q("[data-decision]");
    decision.className = `m2328-decision ${authorized ? "m2328-grant" : "m2328-deny"}`;
    decision.innerHTML = `<span>${authorized ? "ACCESS GRANTED" : "ACCESS DENIED"}</span><h2>${identity} may ${authorized ? action.replace(":", " ") : "not perform this action"}</h2><p>${!known ? "The identity claim is unknown, so later policy checks cannot proceed." : !authenticated ? "Authentication failed, so authorization was not evaluated." : permitted ? "Authentication succeeded and the directory-assigned role permits the action." : "Authentication succeeded, but the directory-assigned role does not permit the action."}</p>`;
    q("[data-evidence]").innerHTML = `<span>ACCOUNTABILITY RECORD</span><code>EVT-${String(sequence).padStart(4, "0")} · ${identity} · ${action} · ${authorized ? "ALLOW" : "DENY"}</code><p>${strong && authorized ? "Strong authentication plus a protected, signed record could support attribution and non-repudiation." : "This event is logged for accountability, but stronger signed evidence would be needed to support non-repudiation."}</p>`;
  }

  on(q("[data-identity]"), "change", () => {
    updateRole();
    resetEvaluation();
  });
  on(q("[data-proof]"), "change", resetEvaluation);
  on(q("[data-action]"), "change", resetEvaluation);
  on(q("[data-submit]"), "click", evaluate);
  updateRole();

  return () => listeners.splice(0).forEach((off) => off());
}
