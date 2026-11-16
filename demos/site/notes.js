// A deliberately small Markdown reader for the project's existing notes.
// Raw HTML remains text; links are restricted to web sources and local topics.
function inline(text, parent) {
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\[\[([^\]]+)\]\]/g;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    parent.append(document.createTextNode(text.slice(offset, match.index)));
    let element;
    if (match[1]) { element = document.createElement("code"); element.textContent = match[1]; }
    else if (match[2]) { element = document.createElement("strong"); inline(match[2], element); }
    else if (match[3] || match[4]) { element = document.createElement("em"); element.textContent = match[3] || match[4]; }
    else if (match[5]) {
      element = document.createElement("a"); element.textContent = match[5];
      element.href = match[6]; element.target = "_blank"; element.rel = "noopener noreferrer";
    } else {
      const [destination, label] = match[7].split("|");
      element = document.createElement("span"); element.textContent = label || destination;
    }
    parent.append(element);
    offset = match.index + match[0].length;
  }
  parent.append(document.createTextNode(text.slice(offset)));
}

export function renderMarkdown(markdown, root) {
  root.replaceChildren();
  let paragraph = null;
  let list = null;
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim()) { paragraph = null; list = null; continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    const item = line.match(/^[-*]\s+(.+)/);
    if (heading) {
      paragraph = null; list = null;
      const node = document.createElement(`h${Math.min(6, Math.max(3, heading[1].length))}`);
      inline(heading[2], node); root.append(node);
    } else if (item) {
      paragraph = null;
      if (!list) { list = document.createElement("ul"); root.append(list); }
      const node = document.createElement("li"); inline(item[1], node); list.append(node);
    } else {
      list = null;
      if (!paragraph) { paragraph = document.createElement("p"); root.append(paragraph); }
      else paragraph.append(document.createElement("br"));
      inline(line.trim(), paragraph);
    }
  }
}

export async function fetchNotes(id, signal) {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) throw new Error("Notes unavailable");
  return response.json();
}

export function showNotesError(container, retry) {
  container.replaceChildren();
  const text = document.createElement("p");
  text.textContent = "The notes couldn’t load. Try again. If this continues, check that the local lab server is running and its notes files are available.";
  const button = document.createElement("button");
  button.type = "button"; button.className = "button subtle"; button.textContent = "Reload notes";
  button.addEventListener("click", retry);
  container.append(text, button);
}

export function createNotesReader(root) {
  const workspace = document.querySelector("#learning-workspace");
  const experiment = document.querySelector("#experiment-workspace");
  const sidebar = document.querySelector(".sidebar");
  const panel = document.querySelector("#notes-panel");
  const title = document.querySelector("#notes-title");
  const content = document.querySelector("#notes-content");
  const source = document.querySelector("#notes-source");
  const trigger = document.querySelector("#read-notes");
  const closeButton = document.querySelector("#close-notes");
  const narrow = window.matchMedia("(max-width: 1279px)");
  let topic = null;
  let open = false;
  let request = null;
  let scrollBeforeReading = 0;

  function layout() {
    const readingView = open && narrow.matches;
    const focused = document.activeElement;
    experiment.hidden = readingView;
    sidebar.hidden = readingView;
    document.body.classList.toggle("reading-view", readingView);
    workspace.classList.toggle("notes-open", open);
    closeButton.textContent = readingView ? "Return to experiment" : "Close notes";
    if (readingView && (experiment.contains(focused) || sidebar.contains(focused))) title.focus();
    window.dispatchEvent(new Event("resize"));
  }

  async function load() {
    request?.abort();
    const current = new AbortController(); request = current;
    const id = topic.id;
    title.textContent = `${topic.number} · ${topic.title}`;
    source.textContent = "";
    content.textContent = "Loading reference notes…";
    content.setAttribute("aria-busy", "true");
    try {
      const notes = await fetchNotes(id, current.signal);
      if (current.signal.aborted || topic.id !== id) return;
      renderMarkdown(notes.markdown, content);
      source.textContent = `Source: ${notes.source}.${content.querySelector("a") ? " Source links open in a new tab and need internet access." : ""}`;
    } catch (error) {
      if (error.name !== "AbortError") showNotesError(content, load);
    } finally {
      if (request === current) content.removeAttribute("aria-busy");
    }
  }

  function close({ focus = true } = {}) {
    if (!open) return;
    const wasNarrow = narrow.matches;
    open = false; request?.abort();
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.textContent = `Read ${topic.number} notes`;
    layout();
    if (focus) {
      if (wasNarrow) window.scrollTo(0, scrollBeforeReading);
      trigger.focus({ preventScroll: true });
    }
  }

  function show() {
    if (open) { close(); return; }
    if (!topic || topic.id === "105-1") return;
    scrollBeforeReading = window.scrollY;
    open = true; panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    trigger.textContent = "Close notes";
    root.dispatchEvent(new Event("lab:pause"));
    layout();
    load();
    title.focus({ preventScroll: !narrow.matches });
  }
  trigger.addEventListener("click", show);
  closeButton.addEventListener("click", () => close());
  panel.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); close(); }
  });
  narrow.addEventListener("change", layout);
  document.querySelector("#notes-width").addEventListener("input", event => {
    workspace.style.setProperty("--notes-width", `${event.target.value}px`);
    event.target.setAttribute("aria-valuetext", `${event.target.value} pixels`);
    window.dispatchEvent(new Event("resize"));
  });
  return {
    close,
    setTopic(next) {
      close({ focus: false }); topic = next;
      trigger.hidden = next.id === "105-1";
      trigger.textContent = `Read ${next.number} notes`;
      document.querySelector("#current-topic").textContent = `${next.number} · ${next.title}`;
    },
    pauseIfReading() { if (open) root.dispatchEvent(new Event("lab:pause")); },
  };
}
