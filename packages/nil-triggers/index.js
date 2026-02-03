/**
 * nil-triggers
 *
 * Heuristic detection library for the nil protocol.
 * Each function takes conversation data and returns a boolean:
 * true means the calling agent should consider invoking nil.
 *
 * These are behavioural signals, not emotional assessments.
 * They don't model the user's feelings. They notice patterns
 * that suggest the optimisation loop may no longer be helping.
 *
 * All functions are stateless. They operate on whatever data
 * you pass in and retain nothing.
 */

/**
 * @typedef {Object} Message
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {number} timestamp - Unix ms
 */

/**
 * Loop detection.
 *
 * Returns true when the user has requested structurally similar
 * outputs multiple times without accepting any. This catches the
 * "generate another version" spiral where each output is rejected
 * and the next request is essentially the same.
 *
 * @param {Message[]} messages - Recent conversation history
 * @param {Object} [options]
 * @param {number} [options.threshold=3] - Consecutive similar requests before triggering
 * @param {number} [options.similarityFloor=0.6] - How similar requests need to be (0-1)
 * @returns {boolean}
 */
export function detectLoop(messages, options = {}) {
  const { threshold = 3, similarityFloor = 0.6 } = options;

  const userMessages = messages
    .filter((m) => m.role === "user")
    .slice(-threshold - 1);

  if (userMessages.length < threshold) return false;

  const recent = userMessages.slice(-threshold);
  const similarities = [];

  for (let i = 1; i < recent.length; i++) {
    similarities.push(
      cosineSimilarity(tokenise(recent[i - 1].content), tokenise(recent[i].content))
    );
  }

  return similarities.every((s) => s >= similarityFloor);
}

/**
 * Velocity collapse.
 *
 * Returns true when the user's message frequency or length drops
 * sharply mid-conversation. A user who was writing paragraphs and
 * suddenly switches to one-word replies, or who was responding
 * every 30 seconds and goes quiet for five minutes — something
 * has shifted.
 *
 * @param {Message[]} messages - Recent conversation history
 * @param {Object} [options]
 * @param {number} [options.lengthDropRatio=0.3] - Trigger if recent messages are this fraction of earlier average length
 * @param {number} [options.frequencyDropRatio=3] - Trigger if gap between recent messages is this multiple of earlier average gap
 * @param {number} [options.windowSize=4] - Number of recent messages to compare against baseline
 * @returns {boolean}
 */
export function detectVelocityCollapse(messages, options = {}) {
  const { lengthDropRatio = 0.3, frequencyDropRatio = 3, windowSize = 4 } = options;

  const userMessages = messages.filter((m) => m.role === "user");

  if (userMessages.length < windowSize * 2) return false;

  const earlier = userMessages.slice(0, -windowSize);
  const recent = userMessages.slice(-windowSize);

  // Check length collapse
  const earlierAvgLength =
    earlier.reduce((sum, m) => sum + m.content.length, 0) / earlier.length;
  const recentAvgLength =
    recent.reduce((sum, m) => sum + m.content.length, 0) / recent.length;

  if (earlierAvgLength > 0 && recentAvgLength / earlierAvgLength <= lengthDropRatio) {
    return true;
  }

  // Check frequency collapse
  const earlierGaps = getGaps(earlier);
  const recentGaps = getGaps(recent);

  if (earlierGaps.length === 0 || recentGaps.length === 0) return false;

  const earlierAvgGap = earlierGaps.reduce((a, b) => a + b, 0) / earlierGaps.length;
  const recentAvgGap = recentGaps.reduce((a, b) => a + b, 0) / recentGaps.length;

  if (earlierAvgGap > 0 && recentAvgGap / earlierAvgGap >= frequencyDropRatio) {
    return true;
  }

  return false;
}

/**
 * Scope creep.
 *
 * Returns true when task complexity is expanding rather than
 * narrowing toward completion. Measured by whether user messages
 * are getting longer and introducing new topics/requests rather
 * than converging on a decision.
 *
 * @param {Message[]} messages - Recent conversation history
 * @param {Object} [options]
 * @param {number} [options.windowSize=5] - Messages to evaluate
 * @param {number} [options.growthRatio=1.5] - Trigger if recent messages are this much longer than earlier ones
 * @returns {boolean}
 */
export function detectScopeCreep(messages, options = {}) {
  const { windowSize = 5, growthRatio = 1.5 } = options;

  const userMessages = messages.filter((m) => m.role === "user");

  if (userMessages.length < windowSize * 2) return false;

  const earlier = userMessages.slice(-windowSize * 2, -windowSize);
  const recent = userMessages.slice(-windowSize);

  const earlierAvgLength =
    earlier.reduce((sum, m) => sum + m.content.length, 0) / earlier.length;
  const recentAvgLength =
    recent.reduce((sum, m) => sum + m.content.length, 0) / recent.length;

  // Messages getting longer suggests expanding scope
  if (recentAvgLength / earlierAvgLength >= growthRatio) {
    // Also check for question marks and conditional language —
    // more questions from the user often means the task is branching, not converging
    const recentQuestions = recent.filter((m) => m.content.includes("?")).length;
    const earlierQuestions = earlier.filter((m) => m.content.includes("?")).length;

    if (recentQuestions >= earlierQuestions) {
      return true;
    }
  }

  return false;
}

/**
 * Saturation.
 *
 * Returns true when the assistant has provided substantive responses
 * but the user keeps requesting more without acting on what's been given.
 * The information needed to decide is already there. More won't help.
 *
 * This is the most direct signal of optimisation saturation.
 *
 * @param {Message[]} messages - Recent conversation history
 * @param {Object} [options]
 * @param {number} [options.assistantResponseThreshold=3] - Number of substantive assistant responses before checking
 * @param {number} [options.minAssistantLength=200] - Minimum character length to count as "substantive"
 * @param {string[]} [options.requestPatterns] - Phrases that suggest the user is asking for more of the same
 * @returns {boolean}
 */
export function detectSaturation(messages, options = {}) {
  const {
    assistantResponseThreshold = 3,
    minAssistantLength = 200,
    requestPatterns = [
      "can you also",
      "what about",
      "another",
      "more",
      "one more",
      "anything else",
      "what else",
      "give me",
      "how about",
      "and also",
      "additionally",
    ],
  } = options;

  const substantiveResponses = messages.filter(
    (m) => m.role === "assistant" && m.content.length >= minAssistantLength
  );

  if (substantiveResponses.length < assistantResponseThreshold) return false;

  // Look at user messages after the threshold was met
  const thresholdTimestamp =
    substantiveResponses[assistantResponseThreshold - 1].timestamp;

  const userMessagesAfterThreshold = messages.filter(
    (m) => m.role === "user" && m.timestamp > thresholdTimestamp
  );

  if (userMessagesAfterThreshold.length === 0) return false;

  // Check if recent user messages are requesting more of the same
  const requestingMore = userMessagesAfterThreshold.filter((m) => {
    const lower = m.content.toLowerCase();
    return requestPatterns.some((pattern) => lower.includes(pattern));
  });

  return requestingMore.length >= 2;
}

/**
 * Combined check. Runs all detectors and returns true if any trigger fires.
 * Also returns which specific triggers fired, for calling agents that
 * want to know (though nil itself doesn't care).
 *
 * @param {Message[]} messages
 * @param {Object} [options] - Per-detector options keyed by detector name
 * @returns {{ triggered: boolean, signals: string[] }}
 */
export function check(messages, options = {}) {
  const signals = [];

  if (detectLoop(messages, options.loop)) signals.push("loop");
  if (detectVelocityCollapse(messages, options.velocityCollapse)) signals.push("velocity-collapse");
  if (detectScopeCreep(messages, options.scopeCreep)) signals.push("scope-creep");
  if (detectSaturation(messages, options.saturation)) signals.push("saturation");

  return {
    triggered: signals.length > 0,
    signals,
  };
}

// --- Internals ---

/** Simple word-level tokeniser. Not meant to be clever. */
function tokenise(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/** Cosine similarity between two token arrays. */
function cosineSimilarity(tokensA, tokensB) {
  const freq = (tokens) => {
    const map = {};
    for (const t of tokens) map[t] = (map[t] || 0) + 1;
    return map;
  };

  const a = freq(tokensA);
  const b = freq(tokensB);
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const key of allKeys) {
    const va = a[key] || 0;
    const vb = b[key] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/** Time gaps between consecutive messages. */
function getGaps(messages) {
  const gaps = [];
  for (let i = 1; i < messages.length; i++) {
    gaps.push(messages[i].timestamp - messages[i - 1].timestamp);
  }
  return gaps;
}
