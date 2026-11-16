// Canvas cannot resolve CSS variables itself. Read the shared palette once per
// frame so previews and theme changes stay in sync without remounting a lab.
export function readDiagramPalette(root) {
  const style = getComputedStyle(root);
  const defaults = { teal: "#61d6c3", amber: "#ffb45a", blue: "#79b8ff", violet: "#c9a9ff", danger: "#ff7f76", orange: "#ff9d76", ink: "#e7f0f1", muted: "#91a5ab", faint: "#789198", onAccent: "#071214" };
  const palette = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) =>
    [key, style.getPropertyValue(`--${key === "onAccent" ? "on-accent" : key}`).trim() || fallback]));
  palette.light = style.colorScheme === "light";
  palette.alpha = (key, opacity) => {
    const hex = palette[key].replace("#", "");
    const rgb = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
    return `rgba(${rgb.join(", ")}, ${opacity})`;
  };
  return palette;
}
