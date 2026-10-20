import { ArcadeBoard } from './ArcadeBoard.js';
/** Shared terminal modal: existing JS/CSS editor plus beginner-friendly AI quizzes. */
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
    this.quizOptions = document.getElementById("quiz-options");
    this.wireBoard = document.getElementById("wire-board");
    this.arcadeBoard=new ArcadeBoard(document.getElementById('arcade-board'),ready=>{this.runBtn.disabled=this._busy||!ready;});
    this.isOpen = false;
    this._listeners = [];
    this._selectedAnswer = null;
    this._onRun = onRun;
    this._onClose = onClose;
    this._listen(this.runBtn, "click", () => this._run());
    this._listen(this.resetBtn, "click", () => this._reset());
    this._listen(this.closeBtn, "click", () => this.close());
    this._listen(this.codeInput, "input", () => this._syncGutter());
    this._listen(this.codeInput, "scroll", () => { this.gutter.scrollTop = this.codeInput.scrollTop; });
    this._listen(this.codeInput, "keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault(); this._run(); return;
      }
      if(e.key === "Tab") {
        e.preventDefault();
        const start=this.codeInput.selectionStart, end=this.codeInput.selectionEnd;
        this.codeInput.value=this.codeInput.value.slice(0,start)+"  "+this.codeInput.value.slice(end);
        this.codeInput.selectionStart=this.codeInput.selectionEnd=start+2;
        this._syncGutter();
      }
    });
    this._listen(window, "keydown", e => {
      if(!this.isOpen) return;
      if(e.code === "Escape") { e.preventDefault(); this.close(); }
      else if(["quiz", "wires","arcade"].includes(this.task?.type) && (e.ctrlKey||e.metaKey) && e.key === "Enter") {
        e.preventDefault(); this._run();
      }
    });
    this._listen(this.wireBoard, "click", e => this._connectWire(e));
    this._listen(this.quizOptions,"click",e=>{
      const button=e.target.closest("button[data-answer]");
      if(!button) return;
      this._selectedAnswer=Number(button.dataset.answer);
      this.quizOptions.querySelectorAll("button").forEach(b=>{
        const selected=b===button;
        b.classList.toggle("selected",selected);
        b.setAttribute("aria-pressed",String(selected));
      });
      this.runBtn.disabled=false;
      this._clearResult();
    });
  }
  _listen(target,event,listener) {
    target.addEventListener(event,listener);
    this._listeners.push(()=>target.removeEventListener(event,listener));
  }
  open(title,task) {
    if(this.isOpen || !task) return;
    this.isOpen=true;this._busy=false;
    clearTimeout(this._closeAnimTimeout);
    this.task=task;
    this.titleEl.textContent=title||task.title;
    this.promptEl.textContent=task.prompt;
    this._starterCode=task.starterCode||"";
    this.codeInput.value=this._starterCode;
    this._selectedAnswer=null;
    this._clearResult();
    const quiz=task.type==='quiz', wires=task.type==='wires',arcade=task.type==='arcade';
    this.backdrop.classList.toggle('theme-arcade',arcade);
    this.arcadeBoard.stop();
    this.backdrop.classList.toggle("theme-wires", wires);
    this._wireConnections = Array(4).fill(null);
    this._wireSelected = null;
    this.wireBoard.replaceChildren();
    if (wires) this._drawWires();
    this.backdrop.classList.toggle("theme-ai",quiz || wires);
    this.backdrop.classList.toggle('theme-html',task.theme==='office'&&quiz);
    this.backdrop.classList.toggle("theme-park",task.theme==="park");
    this.backdrop.classList.toggle("theme-office",task.theme==='office'||(!quiz&&!wires&&task.theme!=="park"));
    this.runBtn.textContent=wires ? "Ulanishni tekshirish" : quiz ? "Javobni tekshirish" : "Run · Ctrl+Enter";
    this.resetBtn.textContent=wires ? "Simlarni qayta ulash" : quiz ? "Qayta tanlash" : "Reset";
    this.runBtn.disabled=quiz || wires;
    if(arcade){this.runBtn.textContent='Natijani tasdiqlash';this.resetBtn.textContent='Qayta boshlash';this.arcadeBoard.open(task);}
    this.quizOptions.replaceChildren();
    if(quiz) task.options.forEach((option,index)=>{
      const button=document.createElement("button");
      button.type="button"; button.className="quiz-option"; button.dataset.answer=index;
      button.setAttribute("aria-pressed","false");
      const letter=document.createElement("span"); letter.className="quiz-letter";
      letter.textContent=String.fromCharCode(65+index);
      const text=document.createElement("span"); text.textContent=option;
      button.append(letter,text); this.quizOptions.append(button);
    });
    this.backdrop.classList.remove("hidden");
    this._openFrame=requestAnimationFrame(()=>{
      if(!this.isOpen) return;
      this.backdrop.classList.add("open");
      if(arcade)this.arcadeBoard.root.focus();
      else if(wires) this.wireBoard.querySelector("button")?.focus();
      else if(quiz) this.quizOptions.querySelector("button")?.focus();
      else {
        this._syncGutter(); this.codeInput.focus();
        const idx=this._starterCode.indexOf("\n\n");
        if(idx>=0) this.codeInput.selectionStart=this.codeInput.selectionEnd=idx+1;
      }
    });
  }
  close() {
    if(!this.isOpen || this._busy) return;
    this.isOpen=false;
    this.arcadeBoard.stop();
    cancelAnimationFrame(this._openFrame);
    this.backdrop.classList.remove("open");
    this._closeAnimTimeout=setTimeout(()=>this.backdrop.classList.add("hidden"),240);
    this._onClose?.();
  }
  setBusy(value) {this._busy=value;this.runBtn.disabled=value;this.resetBtn.disabled=value;this.closeBtn.disabled=value;this.quizOptions.inert=value;this.wireBoard.inert=value;this.arcadeBoard.root.inert=value;}
  showResult({results=[],allPass,explanation,energyDelta,energy}) {
    const panel=this.resultPanel;
    panel.classList.remove("hidden");
    panel.classList.toggle("result-ok",allPass); panel.classList.toggle("result-bad",!allPass);
    panel.replaceChildren();
    const header=document.createElement("div"); header.className="result-header";
    header.textContent=allPass ? (["quiz","wires"].includes(this.task.type) ? "✓ To'g'ri javob!" : "✓ To'g'ri! Barcha testlar o'tdi.") : "Qaytadan urinib ko'ring.";
    panel.append(header);
    if(energy!==undefined){const p=document.createElement('p');p.textContent=`Quvvat: ${energy}% (${energyDelta>0?'+':''}${energyDelta}%).`;panel.append(p);}
    if(this.task.type==='arcade'){header.textContent=allPass?'Bosqich bajarildi!':'Qayta sinab ko‘ring.';const p=document.createElement('p');p.textContent=allPass?explanation:'Natija to‘g‘ri emas. Qayta boshlash orqali yana urinib ko‘ring.';panel.append(p);return;}
    if(["quiz","wires"].includes(this.task.type)) {
      const detail=document.createElement("p");
      detail.textContent=allPass ? explanation : this.task.type==="wires" ? "Rang va belgilar mos bo‘lishi kerak. Ulanishlarni tekshiring." : "Yana bir variantni tanlang. Siz uddalaysiz!";
      panel.append(detail); return;
    }
    results.forEach(r=>{
      const row=document.createElement("div");
      row.className="result-row "+(r.pass?"pass":"fail");
      const icon=document.createElement("span"); icon.className="result-icon"; icon.textContent=r.pass?"✓":"✗";
      const text=document.createElement("span"); text.className="result-io";
      text.textContent=r.label!==undefined
        ? `${r.label}: kutilgan "${r.expected}", topilgan "${r.actual}"`
        : `kirish: ${JSON.stringify(r.input)} → kutilgan: ${JSON.stringify(r.expected)}, natija: ${r.error||JSON.stringify(r.actual)}`;
      row.append(icon,text); panel.append(row);
    });
  }
  _reset() {
    if(this._busy)return;
    this._clearResult();
    if(this.task?.type==='arcade'){this.arcadeBoard.open(this.task);return;}
    if(this.task?.type==="wires") {
      this._wireConnections = Array(4).fill(null); this._wireSelected=null;
      this._drawWires(); this.runBtn.disabled=true; return;
    }
    if(this.task?.type==="quiz") {
      this._selectedAnswer=null; this.runBtn.disabled=true;
      this.quizOptions.querySelectorAll("button").forEach(b=>{
        b.classList.remove("selected"); b.setAttribute("aria-pressed","false");
      });
      this.quizOptions.querySelector("button")?.focus(); return;
    }
    this.codeInput.value=this._starterCode;
    this._syncGutter(); this.codeInput.focus();
  }
  _clearResult() {
    this.resultPanel.classList.add("hidden");
    this.resultPanel.classList.remove("result-ok","result-bad");
    this.resultPanel.replaceChildren();
  }
  _run() {
    if(this._busy)return;
    if(!this.isOpen) return;
    if(this.task?.type==='arcade'){if(!this.runBtn.disabled)this._onRun?.(this.arcadeBoard.getAnswer());return;}
    if(this.task?.type==="quiz" && this._selectedAnswer===null) return;
    if(this.task?.type==="wires") {
      if(this._wireConnections.some(value=>value===null)) return;
      this._onRun?.([...this._wireConnections]); return;
    }
    this._onRun?.(this.task?.type==="quiz" ? this._selectedAnswer : this.codeInput.value);
  }
  _connectWire(e) {
    const left=e.target.closest("button[data-wire-left]");
    const right=e.target.closest("button[data-wire-right]");
    if(left) this._wireSelected=Number(left.dataset.wireLeft);
    if(right && this._wireSelected!==null) {
      const index=Number(right.dataset.wireRight);
      this._wireConnections=this._wireConnections.map((value,i)=>value===index&&i!==this._wireSelected?null:value);
      this._wireConnections[this._wireSelected]=index;
      this._wireSelected=null; this._clearResult();
    }
    this._drawWires();
    this.runBtn.disabled=this._wireConnections.some(value=>value===null);
  }
  _drawWires() {
    const board=this.wireBoard, task=this.task;
    // Preserve keyboard focus while redrawing the connection lines.
    const focused=document.activeElement?.dataset;
    const focusLeft=focused?.wireLeft,focusRight=focused?.wireRight;
    board.replaceChildren();
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 520 264");
    svg.setAttribute("preserveAspectRatio","none");
    svg.setAttribute("aria-hidden","true");
    this._wireConnections.forEach((target,i)=>{
      if(target===null) return;
      const path=document.createElementNS(svg.namespaceURI,"path");
      path.setAttribute("d",`M 140 ${36+i*60} C 240 ${36+i*60}, 280 ${36+target*60}, 380 ${36+target*60}`);
      path.setAttribute("stroke",task.left[i].color);
      path.setAttribute("stroke-width","4");path.setAttribute("fill","none");svg.append(path);
    });
    board.append(svg);
    for(const side of ["left","right"]) {
      const column=document.createElement("div");column.className="wire-column wire-"+side;
      task[side].forEach((pin,index)=>{
        const button=document.createElement("button");
        button.type="button";button.className="wire-pin";
        button.dataset[side==="left"?"wireLeft":"wireRight"]=index;
        button.style.setProperty("--pin-color",pin.color);
        button.textContent=pin.symbol+" "+pin.label;
        const connected=side==="left"?this._wireConnections[index]!==null:this._wireConnections.includes(index);
        button.classList.toggle("connected",connected);
        if(side==="left") {
          button.classList.toggle("selected",this._wireSelected===index);
          button.setAttribute("aria-pressed",String(this._wireSelected===index));
        }
        button.setAttribute("aria-label",(side==="left"?"Sim: ":"Kontakt: ")+pin.label+(connected?" — ulangan":""));
        column.append(button);
      });
      board.append(column);
    }
    if(focusLeft!==undefined) board.querySelector('[data-wire-left="'+focusLeft+'"]')?.focus();
    else if(focusRight!==undefined) board.querySelector('[data-wire-right="'+focusRight+'"]')?.focus();
  }
  _syncGutter() { this.gutter.textContent=this.codeInput.value.split("\n").map((_,i)=>i+1).join("\n"); }
  destroy() {
    this.arcadeBoard.destroy();
    this.isOpen=false;
    clearTimeout(this._closeAnimTimeout);
    cancelAnimationFrame(this._openFrame);
    this._listeners.forEach(remove=>remove());
    this._listeners=[];
  }
}
