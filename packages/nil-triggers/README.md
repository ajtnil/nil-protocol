# nil-triggers

Heuristic trigger library for the nil protocol. Detects when an agent should consider stopping.

## Install

```bash
npm install nil-triggers
```

## Usage

```javascript
import { check } from 'nil-triggers';

const messages = [
  { role: 'user', content: 'Rewrite the intro', timestamp: 1706900000000 },
  { role: 'assistant', content: 'Here you go.', timestamp: 1706900030000 },
  { role: 'user', content: 'Rewrite the intro differently', timestamp: 1706900060000 },
  { role: 'assistant', content: 'Another version.', timestamp: 1706900090000 },
  { role: 'user', content: 'Rewrite the intro again', timestamp: 1706900120000 },
];

const { triggered, signals } = check(messages);
// triggered: true
// signals: ['loop']
```

## Detectors

| Function | What it notices |
|---|---|
| `detectLoop` | User requesting the same thing repeatedly |
| `detectVelocityCollapse` | User messages getting sharply shorter or slower |
| `detectScopeCreep` | Task expanding rather than converging |
| `detectSaturation` | Sufficient info provided but user keeps asking for more |
| `check` | Runs all detectors, returns which fired |

Each function takes a `messages` array and an optional `options` object. All return booleans except `check` which returns `{ triggered, signals }`.

## Options

Every detector has sensible defaults. Override per-detector:

```javascript
const { triggered } = check(messages, {
  loop: { threshold: 4, similarityFloor: 0.7 },
  saturation: { assistantResponseThreshold: 5 },
});
```

## Principles

- Behavioural signals only. No emotional modelling.
- Stateless. Operates on whatever you pass in.
- Cheap. No API calls, no ML inference. Just pattern matching.
- Suggestive, not prescriptive. A trigger firing means "consider calling nil." Not "the user is in distress."
