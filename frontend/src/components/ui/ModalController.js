/**
 * Controller for the code-editor modal. Shows a task prompt plus a small
 * VS Code-like editor (line-number gutter + textarea). Running the code
 * (button or Ctrl+Enter) hands the current text to `onRun`; the caller
 * checks it and calls back into `showResult`.
 */
export class Modal {
  constructor({ onRun, onClose } = {}) {
    this.backdrop = document.getElementById("modal-backdrop");
    this.titleEl = document.getElementById("modal-title");
    this.promptEl = document.getElementById("task-prompt");
    this.codeInput = document.getElementById("code-input");
    this.gutter = document.getElementById("editor-gutter");
    this.runBtn = document.getElementById("btn-run-code");
    this.resetBtn = document.getElementById("btn-reset-code");
    this.closeBtn = document.getElementById("btn-close-modal");
    this.resultPanel = document.getElementById("result-panel");

    this.isOpen = false;
    this._closeAnimTimeout = null;
    this._starterCode = "";
    this._onRun = onRun;

    this.runBtn.addEventListener("click", () => this._run());
    this.resetBtn.addEventListener("click", () => this._reset());
    this.closeBtn.addEventListener("click", () => {
      this.close();
      if (onClose) onClose();
    });

    this.codeInput.addEventListener("input", () => this._syncGutter());
    this.codeInput.addEventListener("scroll", () => {
      this.gutter.scrollTop = this.codeInput.scrollTop;
    });
    this.codeInput.addEventListener("keydown", (e) => {
      // Ctrl/Cmd+Enter runs the code — plain Enter stays a newline so the
      // player can actually write multi-line if/else code.
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this._run();
        return;
      }
      // Tab inserts two spaces instead of jumping focus away.
      if (e.key === "Tab") {
        e.preventDefault();
        const start = this.codeInput.selectionStart;
        const end = this.codeInput.selectionEnd;
        const val = this.codeInput.value;
        this.codeInput.value = val.slice(0, start) + "  " + val.slice(end);
        this.codeInput.selectionStart = this.codeInput.selectionEnd = start + 2;
        this._syncGutter();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape" && this.isOpen) {
        this.close();
        if (onClose) onClose();
      }
    });
  }

  open(title, task) {
    if (this.isOpen) return;
    this.isOpen = true;
    clearTimeout(this._closeAnimTimeout);

    this.task = task;
    this.titleEl.textContent = title || task.title;
    this.promptEl.textContent = task.prompt;
    this._starterCode = task.starterCode;
    this.codeInput.value = task.starterCode;
    this._clearResult();

    // Each area re-skins the terminal (Park's is a grimier green CRT look)
    // instead of a separate Modal implementation — same DOM, different paint.
    this.backdrop.classList.toggle("theme-park", task.theme === "park");
    this.backdrop.classList.toggle("theme-office", task.theme !== "park");

    this.backdrop.classList.remove("hidden");
    requestAnimationFrame(() => {
      this.backdrop.classList.add("open");
      this._syncGutter();
      this.codeInput.focus();
      const idx = task.starterCode.indexOf("\n\n");
      if (idx >= 0) {
        this.codeInput.selectionStart = this.codeInput.selectionEnd = idx + 1;
      }
    });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.backdrop.classList.remove("open");
    this._closeAnimTimeout = setTimeout(() => {
      this.backdrop.classList.add("hidden");
    }, 240); // matches the CSS transition duration
  }

  showResult({ results, allPass }) {
    const panel = this.resultPanel;
    panel.classList.remove("hidden");
    panel.classList.toggle("result-ok", allPass);
    panel.classList.toggle("result-bad", !allPass);

    const header = allPass ? "✅ To'g'ri! Barcha testlar o'tdi." : "❌ Noto'g'ri. Qaytadan urinib ko'ring.";

    const rows = results
      .map((r) => {
        const icon = r.pass ? "✔" : "✘";
        // JS tasks report {input, expected, actual}; CSS tasks report
        // {label, expected, actual} — same row markup, different wording.
        const desc =
          r.label !== undefined
            ? `${r.label}: kutilgan "${r.expected}", topilgan "${r.actual}"`
            : `kirish: ${JSON.stringify(r.input)} &rarr; kutilgan: ${JSON.stringify(
                r.expected
              )}, natija: ${r.error ? `Xato: ${r.error}` : JSON.stringify(r.actual)}`;
        return `<div class="result-row ${r.pass ? "pass" : "fail"}">
          <span class="result-icon">${icon}</span>
          <span class="result-io">${desc}</span>
        </div>`;
      })
      .join("");

    panel.innerHTML = `<div class="result-header">${header}</div><div class="result-list">${rows}</div>`;
  }

  _reset() {
    this.codeInput.value = this._starterCode;
    this._syncGutter();
    this._clearResult();
    this.codeInput.focus();
  }

  _clearResult() {
    this.resultPanel.classList.add("hidden");
    this.resultPanel.classList.remove("result-ok", "result-bad");
    this.resultPanel.innerHTML = "";
  }

  _run() {
    if (this._onRun) this._onRun(this.codeInput.value);
  }

  _syncGutter() {
    const lines = this.codeInput.value.split("\n").length;
    let html = "";
    for (let i = 1; i <= lines; i++) html += i + "\n";
    this.gutter.textContent = html;
  }
}
