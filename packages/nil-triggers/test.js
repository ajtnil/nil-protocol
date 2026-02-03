/**
 * Basic tests for nil-triggers.
 * Run: node test.js
 */

import {
  detectLoop,
  detectVelocityCollapse,
  detectScopeCreep,
  detectSaturation,
  check,
} from "./index.js";

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

const now = Date.now();
const sec = (n) => n * 1000;

// --- Loop detection ---

console.log("\nLoop detection:");

assert(
  detectLoop([
    { role: "user", content: "Can you make the logo bigger?", timestamp: now },
    { role: "assistant", content: "Here's the updated logo.", timestamp: now + sec(30) },
    { role: "user", content: "Can you make the logo a bit bigger?", timestamp: now + sec(60) },
    { role: "assistant", content: "Here's another version.", timestamp: now + sec(90) },
    { role: "user", content: "Make the logo bigger please", timestamp: now + sec(120) },
  ]),
  "detects repeated similar requests"
);

assert(
  !detectLoop([
    { role: "user", content: "Can you make the logo bigger?", timestamp: now },
    { role: "assistant", content: "Done.", timestamp: now + sec(30) },
    { role: "user", content: "Now change the background to blue", timestamp: now + sec(60) },
    { role: "assistant", content: "Done.", timestamp: now + sec(90) },
    { role: "user", content: "Add a subtitle that says hello", timestamp: now + sec(120) },
  ]),
  "does not trigger on different requests"
);

// --- Velocity collapse ---

console.log("\nVelocity collapse:");

assert(
  detectVelocityCollapse([
    { role: "user", content: "I've been thinking about the restructure and I have several ideas about how we might approach the timeline for the project rollout.", timestamp: now },
    { role: "assistant", content: "Response.", timestamp: now + sec(15) },
    { role: "user", content: "The first consideration is around stakeholder alignment, which I think requires a phased approach starting with the leadership team.", timestamp: now + sec(30) },
    { role: "assistant", content: "Response.", timestamp: now + sec(45) },
    { role: "user", content: "Another key factor is the budget allocation across Q3 and Q4 which will determine how aggressively we can pursue the expansion.", timestamp: now + sec(60) },
    { role: "assistant", content: "Response.", timestamp: now + sec(75) },
    { role: "user", content: "And also the hiring plan needs revisiting given the new targets and the constraints we discussed last week.", timestamp: now + sec(90) },
    { role: "assistant", content: "Response.", timestamp: now + sec(105) },
    // Collapse
    { role: "user", content: "yeah", timestamp: now + sec(120) },
    { role: "assistant", content: "Response.", timestamp: now + sec(135) },
    { role: "user", content: "ok", timestamp: now + sec(150) },
    { role: "assistant", content: "Response.", timestamp: now + sec(165) },
    { role: "user", content: "sure", timestamp: now + sec(180) },
    { role: "assistant", content: "Response.", timestamp: now + sec(195) },
    { role: "user", content: "fine", timestamp: now + sec(210) },
  ]),
  "detects sharp drop in message length"
);

// --- Saturation ---

console.log("\nSaturation:");

assert(
  detectSaturation([
    { role: "user", content: "Compare these two job offers for me", timestamp: now },
    { role: "assistant", content: "A".repeat(300), timestamp: now + sec(30) },
    { role: "user", content: "What about the benefits?", timestamp: now + sec(60) },
    { role: "assistant", content: "B".repeat(300), timestamp: now + sec(90) },
    { role: "user", content: "Can you also look at commute times?", timestamp: now + sec(120) },
    { role: "assistant", content: "C".repeat(300), timestamp: now + sec(150) },
    { role: "user", content: "What about career growth?", timestamp: now + sec(180) },
    { role: "assistant", content: "D".repeat(300), timestamp: now + sec(210) },
    { role: "user", content: "Can you also compare the company cultures?", timestamp: now + sec(240) },
    { role: "user", content: "And what about work-life balance? Give me more on that", timestamp: now + sec(270) },
  ]),
  "detects user requesting more after substantive responses"
);

assert(
  !detectSaturation([
    { role: "user", content: "What's the weather?", timestamp: now },
    { role: "assistant", content: "It's sunny.", timestamp: now + sec(10) },
    { role: "user", content: "Thanks", timestamp: now + sec(20) },
  ]),
  "does not trigger on short, resolved conversations"
);

// --- Combined check ---

console.log("\nCombined check:");

const loopConversation = [
  { role: "user", content: "Rewrite the intro paragraph", timestamp: now },
  { role: "assistant", content: "Here's a rewrite.", timestamp: now + sec(30) },
  { role: "user", content: "Rewrite the intro paragraph differently", timestamp: now + sec(60) },
  { role: "assistant", content: "Another version.", timestamp: now + sec(90) },
  { role: "user", content: "Rewrite the intro paragraph again please", timestamp: now + sec(120) },
];

const result = check(loopConversation);
assert(result.triggered === true, "combined check triggers on loop");
assert(result.signals.includes("loop"), "combined check identifies loop signal");

// --- Summary ---

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
