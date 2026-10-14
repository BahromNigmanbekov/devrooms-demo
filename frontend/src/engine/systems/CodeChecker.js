/**
 * Runs the player's submission against a task's checks.
 * - JS tasks (default, `task.type` unset or "js"): the code must define a
 *   `check(input)` function; each test case calls it and compares the
 *   returned value.
 * - CSS tasks (`task.type === "css"`): the code is a `.box { ... }` rule;
 *   declarations are parsed and compared against `task.checks` — no DOM
 *   injection, just a small property-equivalence check, which is plenty
 *   for a "border is red, background is black" style puzzle.
 */
import { validateArcadeAnswer } from "../../../../shared/arcadeActivities.mjs";
import { validateAIAnswer } from "../../../../shared/aiActivities.mjs";

export function runTask(task, userCode) {
  if(task.type==='arcade'){const allPass=validateArcadeAnswer(task,userCode);return {allPass,results:[],explanation:task.explanation};}
  if (["quiz", "wires"].includes(task.type)) {
    const allPass = validateAIAnswer(task, userCode);
    return { allPass, results: [], explanation: allPass ? task.explanation : "" };
  }
  return task.type === "css" ? runCssTask(task, userCode) : runJsTask(task, userCode);
}

function runJsTask(task, userCode) {
  const results = [];

  for (const t of task.tests) {
    try {
      const fn = new Function(
        "__input",
        `"use strict";\n${userCode}\nif (typeof check !== "function") {\n  throw new Error("check funksiyasi topilmadi");\n}\nreturn check(__input);`
      );
      const actual = fn(t.input);
      results.push({ input: t.input, expected: t.expected, actual, pass: actual === t.expected });
    } catch (e) {
      results.push({
        input: t.input,
        expected: t.expected,
        actual: null,
        pass: false,
        error: e.message,
      });
    }
  }

  const allPass = results.length > 0 && results.every((r) => r.pass);
  return { results, allPass };
}

// A handful of common color names mapped to the hex/rgb spellings a player
// might reasonably type instead — this is a puzzle-grading heuristic, not
// a real CSS color parser.
const COLOR_EQUIVALENTS = {
  red: ["red", "#f00", "#ff0000", "rgb(255,0,0)"],
  black: ["black", "#000", "#000000", "rgb(0,0,0)"],
  white: ["white", "#fff", "#ffffff", "rgb(255,255,255)"],
  blue: ["blue", "#00f", "#0000ff", "rgb(0,0,255)"],
  green: ["green", "#008000", "rgb(0,128,0)"],
  yellow: ["yellow", "#ff0", "#ffff00", "rgb(255,255,0)"],
  orange: ["orange", "#ffa500", "rgb(255,165,0)"],
  purple: ["purple", "#800080", "rgb(128,0,128)"],
  pink: ["pink", "#ffc0cb", "rgb(255,192,203)"],
  gray: ["gray", "grey", "#808080", "rgb(128,128,128)"],
};

function normalizeColorToken(str) {
  return String(str).toLowerCase().replace(/\s+/g, "");
}

function colorMatches(actualValue, expectedName) {
  if (!actualValue) return false;
  const options = COLOR_EQUIVALENTS[expectedName.toLowerCase()] || [expectedName.toLowerCase()];
  const actual = normalizeColorToken(actualValue);
  return options.some((opt) => normalizeColorToken(opt) === actual);
}

/** Parses `.box { prop: value; ... }` (or any single rule block) into a { prop: value } map. */
function parseCssDeclarations(userCode) {
  const match = userCode.match(/\{([^}]*)\}/s);
  const body = match ? match[1] : userCode;
  const props = {};
  for (const line of body.split(";")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const prop = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (prop) props[prop] = value;
  }
  return props;
}

/** Pulls a color keyword/hex out of a `border: 3px solid red` style shorthand value. */
function extractColorFromShorthand(value) {
  if (!value) return null;
  const tokens = value.split(/\s+/);
  const hexToken = tokens.find((t) => /^#[0-9a-f]{3,6}$/i.test(t));
  if (hexToken) return hexToken;
  const named = tokens.find((t) => COLOR_EQUIVALENTS[t.toLowerCase()]);
  return named || tokens[tokens.length - 1];
}

function runCssTask(task, userCode) {
  const props = parseCssDeclarations(userCode || "");
  const results = [];

  for (const check of task.checks) {
    let actual = null;
    let pass = false;

    if (check.property === "square") {
      const w = parseFloat(props.width);
      const h = parseFloat(props.height);
      actual = Number.isFinite(w) && Number.isFinite(h) ? `${w}px x ${h}px` : "width/height topilmadi";
      pass = Number.isFinite(w) && Number.isFinite(h) && w > 0 && w === h;
    } else if (check.property === "border-color") {
      const raw = props["border-color"] || extractColorFromShorthand(props.border);
      actual = raw || "topilmadi";
      pass = colorMatches(raw, check.expected);
    } else if (check.property === "background-color") {
      const raw = props["background-color"] || extractColorFromShorthand(props.background);
      actual = raw || "topilmadi";
      pass = colorMatches(raw, check.expected);
    } else if (check.property === "has-border") {
      const raw = props.border || props["border-width"];
      actual = raw || "topilmadi";
      pass = !!raw && !/^0(px)?$/.test(raw.trim());
    }

    results.push({ label: check.label, expected: check.expected, actual, pass });
  }

  const allPass = results.length > 0 && results.every((r) => r.pass);
  return { results, allPass };
}
