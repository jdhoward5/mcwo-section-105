// Standalone review surface: themes are injected only into this preview iframe.
const themes = {
  teal: { name: "Deep Teal", mode: "dark", page: "#071214", panel: "#0c1a1d", raised: "#102226", ink: "#e7f0f1", muted: "#91a5ab", faint: "#789198", accent: "#61d6c3", onAccent: "#071214", line: "#294043", description: "The original palette: immersive and cohesive, with bright teal wayfinding. The darkest option for both reading and experiments." },
  slate: { name: "Slate Blue", mode: "dark", page: "#111a28", panel: "#182438", raised: "#213149", ink: "#e7eef8", muted: "#a9b7ca", faint: "#889db6", accent: "#9ac2ff", onAccent: "#101a2a", line: "#39495e", description: "A cooler dark alternative. Blue navigation and clearer surface separation give the workspace a quieter, more neutral character." },
  paper: { name: "Paper & Ink · default", mode: "light", page: "#f5f2e9", panel: "#fffdf6", raised: "#e8eee8", ink: "#25352f", muted: "#53655c", faint: "#5d6f65", accent: "#17634f", onAccent: "#fffdf6", line: "#c7d0c7", description: "The selected default for teaching and reading: warm paper, forest-green actions, and matching light experiments and diagrams." },
  copper: { name: "Stone & Copper", mode: "light", page: "#f4efe9", panel: "#fffbf7", raised: "#eee1d8", ink: "#382e2b", muted: "#6c5850", faint: "#796158", accent: "#943f29", onAccent: "#fffaf6", line: "#d4beb2", description: "A warmer editorial direction. Stone surfaces and copper navigation create a stronger distinction between the reading workspace and the technical experiments." },
};
const preview = document.querySelector("#lab-preview");
const choices = document.querySelector("#themes");
const notes = document.querySelector("#preview-notes");
let selected = Object.hasOwn(themes, location.hash.slice(1)) ? location.hash.slice(1) : "paper";
for (const [id, theme] of Object.entries(themes)) {
  const label = document.createElement("label"); label.className = "theme-option";
  const input = document.createElement("input"); input.type = "radio"; input.name = "theme"; input.value = id; input.checked = id === selected;
  const title = document.createElement("span"); title.textContent = theme.name;
  const swatches = document.createElement("span"); swatches.className = "swatches"; swatches.setAttribute("aria-hidden", "true");
  for (const color of [theme.page, theme.panel, theme.accent]) { const swatch = document.createElement("i"); swatch.style.setProperty("--swatch", color); swatches.append(swatch); }
  label.append(input, title, swatches); choices.append(label);
  input.addEventListener("change", () => { selected = id; history.replaceState(null, "", `#${id}`); apply(); });
}
function apply() {
  const t = themes[selected];
  document.querySelector("#theme-description").textContent = t.description;
  const doc = preview.contentDocument;
  if (!doc?.head) return;
  let style = doc.querySelector("#theme-review-palette");
  if (!style) { style = doc.createElement("style"); style.id = "theme-review-palette"; doc.head.append(style); }
  const defaultTheme = doc.querySelector("#paper-ink-theme");
  if (defaultTheme) defaultTheme.disabled = selected !== "paper";
  if (selected === "paper" || selected === "teal") { style.textContent = ""; return; }
  style.textContent = `
    :root { color-scheme:${t.mode}; --page:${t.page}; --panel:${t.panel}; --panel-raised:${t.raised}; --ink:${t.ink}; --muted:${t.muted}; --faint:${t.faint}; --teal:${t.accent}; --line:${t.line}; }
    body { background:var(--page); }
    .topbar, .sidebar { background:var(--panel); backdrop-filter:none; }
    .brand-mark, .skip-link, .reference-page .button.primary { background:${t.accent}; color:${t.onAccent}; }
    .nav-item:hover, .topic-family > summary:hover { background:${t.raised}; }
    .nav-item.active { background:${t.raised}; border-color:${t.accent}; }
    .topic-toolbar .button:hover, .notes-panel .button:hover { color:${t.ink}; border-color:${t.accent}; }
    .notes-content code { color:${t.mode === "light" ? "#844515" : "#ffb45a"}; }
    /* Keep teaching colors and dark experiment surfaces stable across comparisons. */
    .demo-page:not(.reference-page), .m2328-page {
      color-scheme:dark; color:#e7f0f1; --ink:#e7f0f1; --muted:#91a5ab; --faint:#789198;
      --page:#071214; --panel:#0c1a1d; --panel-raised:#102226; --line:rgba(173,208,211,.13);
      --teal:#61d6c3; --teal-dim:rgba(97,214,195,.12); --amber:#ffb45a; --blue:#79b8ff;
    }
    .demo-page:not(.reference-page) > :not(header):not(p), .m2328-page > :not(header):not(p) { background-color:#0c1a1d; }
    #demo-root .demo-page > p { color:${t.muted}; }
    #demo-root .demo-page > p strong { color:${t.ink}; }
    #demo-root .demo-page > p code { color:${t.accent}; }
    #demo-root h1, #demo-root .lede strong { color:${t.ink}; }
    #demo-root .lede, #demo-root .m2328-header p { color:${t.muted}; }
    .demo-header .chip, .m2328-header .m2328-badge { background:${t.raised}; }
    .demo-header .chip.algorithm { color:${t.mode === "light" ? "#844515" : "#ffb45a"}; }
    .demo-header .chip.encoding { color:${t.mode === "light" ? "#245a94" : "#79b8ff"}; }
    .demo-header .chip.protocol { color:${t.mode === "light" ? "#17634f" : "#61d6c3"}; }
    .m2328-header .m2328-badge { color:${t.accent}; }
    .notes-panel { color-scheme:${t.mode}; }
  `;
}
preview.addEventListener("load", () => { apply(); notes.disabled = false; });
notes.addEventListener("click", () => {
  const doc = preview.contentDocument;
  const close = doc.querySelector("#close-notes");
  const trigger = doc.querySelector("#read-notes");
  if (doc.querySelector("#notes-panel")?.hidden === false) close.click();
  else if (trigger && !trigger.hidden) trigger.click();
});
apply();
