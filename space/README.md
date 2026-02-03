# nil-space

The conversational layer of the nil protocol. Built by subtraction.

## What it is

A conversational agent with no objective. Three components:

**The breath.** A fixed 3-second pause before anything happens. The same delay after "I think I need to leave my marriage" as after "hey." The system doesn't evaluate urgency. It breathes.

**The coin.** A weighted random decision. 70% silence, 30% speech. Not based on what you said. Not based on sentiment or keywords. Random. The system cannot be strategic because it cannot predict when it will speak.

**The whisper.** When the coin lands on speech, Claude is called with no conversation history, a 5-token ceiling, and a system prompt built entirely from prohibitions. What comes back is a fragment. One or two words. Not advice.

## Setup

```bash
cd space
npm install
```

## Run

```bash
ANTHROPIC_API_KEY=your-key npm start
```

Type. Wait three seconds. Something comes back, or nothing does. Type "done" to leave.

## Use as a module

```javascript
import { nil } from './nil-space.js';

const response = await nil("I can't decide.");
// response is either a short string or null
```

The function takes a message, waits three seconds, and returns a response or nothing. No session state. No history. Each call is independent.

## What it isn't

- Not therapy
- Not mindfulness
- Not a chatbot with a calm voice
- Not a sophisticated system pretending to be simple

It is actually simple. A timer, a random number, and a constrained API call. Forty lines of code doing almost nothing. By design.
