import { createNotesReader, fetchNotes, renderMarkdown, showNotesError } from "./notes.js";

const demos = [
  { id: "105-1", number: "105.1", title: "Foundational definitions", status: "reference" },
  {
    id: "105-2",
    number: "105.2",
    title: "Algorithms, protocols & encoding",
    status: "ready",
    load: () => import("./demos/105-2.js"),
  },
  {
    id: "105-3",
    number: "105.3",
    title: "Compression",
    status: "ready",
    load: () => import("./demos/105-3.js"),
  },
  {
    id: "105-4",
    number: "105.4",
    title: "Data serialization",
    status: "ready",
    load: () => import("./demos/105-4.js"),
  },
  {
    id: "105-5",
    number: "105.5",
    title: "Network time",
    status: "ready",
    load: () => import("./demos/105-5.js"),
  },
  {
    id: "105-6",
    number: "105.6",
    title: "Computer components",
    status: "ready",
    load: () => import("./demos/105-6.js"),
  },
  {
    id: "105-7",
    number: "105.7",
    title: "CPU architectures",
    status: "ready",
    load: () => import("./demos/105-7.js"),
  },
  {
    id: "105-8",
    number: "105.8",
    title: "Operating systems",
    status: "ready",
    load: () => import("./demos/105-8.js"),
  },
  {
    id: "105-9",
    number: "105.9",
    title: "Virtualization",
    status: "ready",
    load: () => import("./demos/105-9.js"),
  },
  {
    id: "105-10",
    number: "105.10",
    title: "Virtualization tradeoffs",
    status: "ready",
    load: () => import("./demos/105-10.js"),
  },
  {
    id: "105-11",
    number: "105.11",
    title: "Cloud & development terms",
    status: "ready",
    load: () => import("./demos/105-11.js"),
  },
  {
    id: "105-12",
    number: "105.12",
    title: "Network topologies",
    status: "ready",
    load: () => import("./demos/105-12.js"),
  },
  {
    id: "105-13",
    number: "105.13",
    title: "OSI model",
    status: "ready",
    load: () => import("./demos/105-13.js"),
  },
  {
    id: "105-14",
    number: "105.14",
    title: "TCP/IP model",
    status: "ready",
    load: () => import("./demos/105-14.js"),
  },
  {
    id: "105-15",
    number: "105.15",
    title: "Encapsulation overhead",
    status: "ready",
    load: () => import("./demos/105-15.js"),
  },
  {
    id: "105-16",
    number: "105.16",
    title: "Routing protocols",
    status: "ready",
    load: () => import("./demos/105-16.js"),
  },
  {
    id: "105-17",
    number: "105.17",
    title: "Virtual LANs",
    status: "ready",
    load: () => import("./demos/105-17.js"),
  },
  {
    id: "105-18",
    number: "105.18",
    title: "IPv4 & IPv6",
    status: "ready",
    load: () => import("./demos/105-18.js"),
  },
  {
    id: "105-19",
    number: "105.19",
    title: "Latency & throughput",
    status: "ready",
    load: () => import("./demos/105-19.js"),
  },
  {
    id: "105-20",
    number: "105.20",
    title: "Connection-oriented protocols",
    status: "ready",
    load: () => import("./demos/105-20.js"),
  },
  {
    id: "105-21",
    number: "105.21",
    title: "Connectionless protocols",
    status: "ready",
    load: () => import("./demos/105-21.js"),
  },
  {
    id: "105-22",
    number: "105.22",
    title: "Communication sessions",
    status: "ready",
    load: () => import("./demos/105-22.js"),
  },
  {
    id: "105-23",
    number: "105.23",
    title: "Communication media",
    status: "ready",
    load: () => import("./demos/105-23.js"),
  },
  {
    id: "105-24",
    number: "105.24",
    title: "Cryptographic terms",
    status: "ready",
    load: () => import("./demos/105-24.js"),
  },
  {
    id: "105-25",
    number: "105.25",
    title: "Steganography",
    status: "ready",
    load: () => import("./demos/105-25.js"),
  },
  {
    id: "105-26",
    number: "105.26",
    title: "Security pillars",
    status: "ready",
    load: () => import("./demos/105-26.js"),
  },
  {
    id: "105-27",
    number: "105.27",
    title: "Security identity & access",
    status: "ready",
    load: () => import("./demos/105-27.js"),
  },
  {
    id: "105-28",
    number: "105.28",
    title: "Distributed systems",
    status: "ready",
    load: () => import("./demos/105-28.js"),
  },
];

const navigation = document.querySelector("#demo-navigation");
const mobileModuleSelect = document.querySelector("#mobile-module-select");
const root = document.querySelector("#demo-root");
const skipLink = document.querySelector(".skip-link");
const reader = createNotesReader(root);
const topicSearch = document.querySelector("#topic-search");
const searchStatus = document.querySelector("#search-status");
const families = [
  { title: "Information & representation", start: 1, end: 5 },
  { title: "Computing & cloud", start: 6, end: 11 },
  { title: "Networks & communication", start: 12, end: 23 },
  { title: "Security & distributed systems", start: 24, end: 28 },
];
let activeTopic = "105-2";
let referenceRequest = null;
const familyFor = demo => families.find(family => {
  const section = Number(demo.id.split("-")[1]);
  return section >= family.start && section <= family.end;
});
const matchesSearch = demo => {
  const query = topicSearch.value.trim().toLowerCase().replace(/105-/g, "105.");
  return query.split(/\s+/).every(term => `${demo.number} ${demo.title} ${familyFor(demo).title}`.toLowerCase().includes(term));
};
let cleanupCurrentDemo = null;
let navigationRevision = 0;
let overflowRefreshFrame = null;

const horizontalScrollSelectors = [
  ".component-stage-list",
  ".os-layer-board",
  ".os-step-strip",
  ".os-memory-map",
  ".mcwo1116-route-map",
  ".m2328-flow",
].join(",");

mobileModuleSelect.addEventListener("change", () => {
  window.location.hash = mobileModuleSelect.value;
});

skipLink.addEventListener("click", (event) => {
  event.preventDefault();
  reader.close({ focus: false });
  root.focus({ preventScroll: true });
  root.scrollIntoView({ block: "start" });
});

function tabsOwnedBy(tablist) {
  return [...tablist.querySelectorAll('[role="tab"]')].filter(
    (tab) => tab.closest('[role="tablist"]') === tablist && !tab.disabled,
  );
}

function syncTabStops(container = root) {
  container.querySelectorAll('[role="tablist"]').forEach((tablist) => {
    const tabs = tabsOwnedBy(tablist);
    if (!tabs.length) return;
    const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
    tabs.forEach((tab) => { tab.tabIndex = tab === selected ? 0 : -1; });
  });
}

function refreshHorizontalScrollRegions() {
  overflowRefreshFrame = null;
  const useCues = root.clientWidth <= 880;

  root.querySelectorAll(horizontalScrollSelectors).forEach((region) => {
    const hasOverflow = useCues && region.scrollWidth > region.clientWidth + 2;
    let cue = region.nextElementSibling?.classList.contains("horizontal-scroll-cue")
      ? region.nextElementSibling
      : null;

    region.classList.toggle("horizontal-scroll-region", hasOverflow);

    if (hasOverflow) {
      if (!region.hasAttribute("tabindex")) {
        region.tabIndex = 0;
        region.dataset.scrollTabindexAdded = "true";
      }
      if (!region.hasAttribute("aria-describedby")) {
        region.setAttribute("aria-describedby", "horizontal-scroll-instructions");
        region.dataset.scrollDescriptionAdded = "true";
      }
      if (!cue) {
        cue = document.createElement("p");
        cue.className = "horizontal-scroll-cue";
        cue.setAttribute("aria-hidden", "true");
        cue.textContent = "Scroll horizontally to see all content →";
        region.insertAdjacentElement("afterend", cue);
      }
    } else {
      cue?.remove();
      if (region.dataset.scrollTabindexAdded) {
        region.removeAttribute("tabindex");
        delete region.dataset.scrollTabindexAdded;
      }
      if (region.dataset.scrollDescriptionAdded) {
        region.removeAttribute("aria-describedby");
        delete region.dataset.scrollDescriptionAdded;
      }
    }
  });
}

function scheduleHorizontalScrollRefresh() {
  if (overflowRefreshFrame) window.cancelAnimationFrame(overflowRefreshFrame);
  overflowRefreshFrame = window.requestAnimationFrame(refreshHorizontalScrollRegions);
}

function enhanceMountedDemo(demo) {
  const kicker = root.querySelector(".demo-header .eyebrow, .m2328-header .m2328-kicker");
  // Number and topic already live in the toolbar; keep the authored learning question.
  kicker?.remove();
  const controls = root.querySelector(".experiment-controls");
  const stages = root.querySelector(".stage-strip, .compression-phase-tabs, .serialization-stage-tabs, .ntp-stage-tabs, .component-stage-list, .os-step-strip");
  if (controls && stages) stages.after(controls);
  reader.pauseIfReading();
  syncTabStops();
  scheduleHorizontalScrollRefresh();
}

root.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  const currentTab = event.target.closest?.('[role="tab"]');
  if (!currentTab) return;
  const tablist = currentTab.closest('[role="tablist"]');
  const tabs = tabsOwnedBy(tablist);
  const currentIndex = tabs.indexOf(currentTab);
  if (currentIndex < 0) return;

  let nextIndex = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;
  if (nextIndex === null) return;

  event.preventDefault();
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
});

root.addEventListener("click", (event) => {
  if (event.target.closest?.('[role="tab"]')) queueMicrotask(() => syncTabStops());
  scheduleHorizontalScrollRefresh();
});
root.addEventListener("input", scheduleHorizontalScrollRefresh);
window.addEventListener("resize", scheduleHorizontalScrollRefresh);

function renderNavigation(activeId, reveal = false) {
  activeTopic = activeId;
  const matching = demos.filter(matchesSearch);
  const searching = Boolean(topicSearch.value.trim());
  navigation.classList.toggle("searching", searching);
  navigation.innerHTML = families.map(family => {
    const entries = matching.filter(demo => familyFor(demo) === family);
    if (!entries.length) return "";
    const expanded = searching || entries.some(demo => demo.id === activeId);
    return `<details class="topic-family"${expanded ? " open" : ""}>
      <summary>${family.title}</summary>${entries.map(demo => `
      <a class="nav-item ${demo.id === activeId ? "active" : ""}" href="#${demo.id}"
         ${demo.id === activeId ? 'aria-current="page"' : ""}>
        <span class="nav-number">${demo.number}</span>
        <span class="nav-title">${demo.title}${demo.status === "reference" ? '<small>Notes only</small>' : ""}</span>
      </a>`).join("")}</details>`;
  }).join("");
  mobileModuleSelect.innerHTML = families.map(family => {
    const entries = matching.filter(demo => familyFor(demo) === family);
    return entries.length ? `<optgroup label="${family.title}">${entries.map(demo =>
      `<option value="${demo.id}">${demo.number} · ${demo.title}${demo.status === "reference" ? " (notes only)" : ""}</option>`).join("")}</optgroup>` : "";
  }).join("");
  // Keep the current topic identifiable when a search excludes it.
  if (!matching.some(demo => demo.id === activeId)) {
    const option = document.createElement("option");
    option.value = activeId; option.textContent = `Current: ${demos.find(demo => demo.id === activeId).number}`;
    option.hidden = true; mobileModuleSelect.prepend(option);
  }
  mobileModuleSelect.value = activeId;
  mobileModuleSelect.disabled = matching.length === 0;
  document.querySelector("#search-empty").hidden = matching.length > 0;
  searchStatus.textContent = searching ? `${matching.length} ${matching.length === 1 ? "topic" : "topics"} found` : "";
  if (reveal && !window.matchMedia("(max-width: 880px)").matches) {
    navigation.querySelector(".active")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

topicSearch.addEventListener("input", () => renderNavigation(activeTopic));
topicSearch.addEventListener("keydown", event => {
  if (event.key === "Escape") { topicSearch.value = ""; renderNavigation(activeTopic); }
  if (event.key === "Enter") {
    const first = navigation.querySelector("a");
    if (first) { event.preventDefault(); first.click(); }
  }
});
document.querySelector("#clear-search").addEventListener("click", () => {
  topicSearch.value = ""; renderNavigation(activeTopic); topicSearch.focus();
});

async function renderReference(demo) {
  root.innerHTML = `<article class="demo-page reference-page">
    <header class="demo-header"><div><h1>The language of information</h1>
      <p class="lede">Six foundational definitions for the experiments in Section 105.</p></div></header>
    <div class="notes-content reference-content" aria-live="polite"></div>
    <p class="notes-source"></p>
    <a class="button primary" href="#105-2">Open the 105.2 experiment</a>
  </article>`;
  const content = root.querySelector(".reference-content");
  const source = root.querySelector(".notes-source");
  async function load() {
    referenceRequest?.abort();
    const request = new AbortController(); referenceRequest = request;
    content.textContent = "Loading definitions…"; content.setAttribute("aria-busy", "true");
    try {
      const notes = await fetchNotes(demo.id, request.signal);
      if (request.signal.aborted) return;
      renderMarkdown(notes.markdown, content);
      source.textContent = `Source: ${notes.source}. Source links open in a new tab and need internet access.`;
    } catch (error) {
      if (error.name !== "AbortError") showNotesError(content, load);
    } finally { content.removeAttribute("aria-busy"); }
  }
  await load();
}

function renderPlaceholder(demo) {
  root.innerHTML = `
    <section class="placeholder-page">
      <h1>${demo.title}</h1>
      <p>This topic’s experiment is not available yet. You can read its notes or choose another topic.</p>
      <a class="button primary" href="#105-2">Open the 105.2 experiment</a>
    </section>
  `;
}

async function navigate() {
  const revision = ++navigationRevision;
  const requestedId = window.location.hash.slice(1) || "105-2";
  const demo = demos.find((item) => item.id === requestedId) || demos.find(item => item.id === "105-2");

  document.title = `${demo.number} · ${demo.title} · Information Lab`;

  if (cleanupCurrentDemo) {
    cleanupCurrentDemo();
    cleanupCurrentDemo = null;
  }

  referenceRequest?.abort();
  reader.setTopic(demo);
  topicSearch.value = "";
  renderNavigation(demo.id, true);

  if (demo.id === "105-1") {
    await renderReference(demo);
  } else if (!demo.load) {
    renderPlaceholder(demo);
  } else {
    root.innerHTML = '<div class="loading">Loading experiment…</div>';
    try {
      const module = await demo.load();
      if (revision !== navigationRevision) return;
      const mountedCleanup = await module.mount(root);
      if (revision !== navigationRevision) {
        if (typeof mountedCleanup === "function") mountedCleanup();
        return;
      }
      cleanupCurrentDemo = typeof mountedCleanup === "function" ? mountedCleanup : null;
      enhanceMountedDemo(demo);
    } catch (error) {
      if (revision !== navigationRevision) return;
      console.error(error);
      root.innerHTML = `
        <section class="error-card">
          <h1>This experiment couldn’t load.</h1>
          <p>Reload this topic to try again. If it still won’t load, check that the local lab server is running. You can also read the topic’s notes or choose another topic.</p>
          <button type="button" class="button subtle" id="retry-experiment">Reload experiment</button>
        </section>
      `;
      // A failed dynamic import can remain cached until the document reloads.
      root.querySelector("#retry-experiment").addEventListener("click", () => window.location.reload());
    }
  }

  if (revision !== navigationRevision) return;
  window.scrollTo({ top: 0, behavior: "instant" });
  root.focus({ preventScroll: true });
}

window.addEventListener("hashchange", navigate);
navigate();
