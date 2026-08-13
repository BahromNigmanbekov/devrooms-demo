/** Clamp a single 0-255 channel value. */
function clampByte(v) {
  return Math.max(0, Math.min(255, v));
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => clampByte(Math.round(v)).toString(16).padStart(2, "0")).join("");
}

/**
 * Lightens (positive amount) or darkens (negative amount) a hex color by
 * adding `amount` to each RGB channel. Used to turn a single player-picked
 * swatch into the light/mid/dark gradient stops the robot shell needs,
 * without hand-authoring a palette per color.
 */
export function shadeHexColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}
