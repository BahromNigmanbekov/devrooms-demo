/**
 * Centralised keyboard state. Movement keys are read as held-state every
 * frame; action keys (like E) also expose a one-shot "justPressed" pulse so
 * a single tap never fires twice or gets missed between frames.
 */
export class InputManager {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();

    this._onKeyDown = (e) => {
      // While the code editor (or any text field) is focused, let the
      // browser handle the keystroke normally — don't hijack WASD/E as
      // movement, and don't preventDefault (that would break typing).
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "TEXTAREA" || tag === "INPUT" || e.target?.isContentEditable) return;

      const code = e.code;
      if (!this.keys.has(code)) this.justPressed.add(code);
      this.keys.add(code);
      if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyE"].includes(code)) {
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "TEXTAREA" || tag === "INPUT" || e.target?.isContentEditable) return;
      this.keys.delete(e.code);
    };

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("blur", () => this.keys.clear());
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasJustPressed(code) {
    return this.justPressed.has(code);
  }

  /** Call once per frame, after game logic has read justPressed keys. */
  endFrame() {
    this.justPressed.clear();
  }

  getMoveVector() {
    let x = 0;
    let y = 0;
    if (this.isDown("KeyW") || this.isDown("ArrowUp")) y -= 1;
    if (this.isDown("KeyS") || this.isDown("ArrowDown")) y += 1;
    if (this.isDown("KeyA") || this.isDown("ArrowLeft")) x -= 1;
    if (this.isDown("KeyD") || this.isDown("ArrowRight")) x += 1;

    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
}
