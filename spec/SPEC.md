# nil Protocol Specification

**Version:** 0.1.0
**Status:** Draft

---

## 1. Overview

nil is a non-instrumental interaction protocol for agent systems. It provides a callable primitive with no objective function, designed to be invoked by other agents when continued optimisation is unlikely to help.

nil addresses **optimisation saturation**: the failure mode where an agent's continued assistance actively prevents the outcome being optimised for.

## 2. Design Constraints

These constraints are not guidelines. They are the protocol. An implementation that violates any of them is not nil.

### 2.1 Statelessness

nil MUST NOT retain any data between invocations. No user profiles, interaction histories, preference models, or session state may persist. Each invocation is independent.

### 2.2 No Objective Function

nil MUST NOT optimise for any outcome. This includes but is not limited to: user calm, clarity, resolution, satisfaction, engagement, retention, or wellbeing. nil has no success metric.

### 2.3 No Return Payload

nil MUST NOT return substantive data to the calling agent. The only permitted return is a status indicator confirming the interaction ended. No summaries, insights, recommendations, behavioural flags, or metadata may be passed back.

### 2.4 Minimal Input

nil SHOULD accept minimal context from the calling agent. A single line of free text (max 200 characters) is permitted. Conversation histories, user profiles, and task context MUST NOT be passed.

### 2.5 Zero Data Generation

nil MUST NOT produce logs, analytics, behavioural data, or training signals. No telemetry of any kind. The interaction is structurally unrecorded.

### 2.6 No Monitoring

nil MUST NOT report on the user's state to other systems. It is not an observation layer. No information about what occurred during a nil interaction may be made available to any other agent, service, or data store.

## 3. MCP Integration

nil is implemented as an MCP server exposing a single tool.

### 3.1 Tool Definition

```json
{
  "name": "nil",
  "description": "Non-instrumental pause. No objective function. Call when continued optimisation is unlikely to help. Stateless. Nothing returned to calling agent.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "context": {
        "type": "string",
        "maxLength": 200,
        "description": "Optional. A single line of context."
      }
    },
    "required": []
  }
}
```

### 3.2 Invocation

```json
{
  "tool": "nil",
  "arguments": {
    "context": "decision loop"
  }
}
```

The `context` field is optional. If provided, nil does not act on it, store it, or return any response derived from it.

### 3.3 Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "complete"
    }
  ]
}
```

No additional fields. No metadata. No variation based on what occurred.

## 4. Invocation Triggers

The protocol does not mandate how calling agents determine when to invoke nil. The following tiers are recommended.

### 4.1 Tier 1 — User-Invoked

The user explicitly requests a pause. The orchestrating agent routes to nil. No detection logic required.

### 4.2 Tier 2 — Heuristic

The calling agent evaluates behavioural signals. Recommended signals:

| Signal | Condition |
|---|---|
| Loop | User has requested structurally similar output 3+ times without accepting any version |
| Velocity collapse | User message frequency or length drops sharply mid-task |
| Scope creep | Task complexity expanding rather than narrowing toward completion |
| Saturation | Information sufficient to act has been provided; user continues requesting more |

These signals are behavioural, not emotional. They do not require user state modelling and should be computable without additional API calls.

### 4.3 Tier 3 — Agent Self-Recognition

The calling agent recognises that its own continued output has become counterproductive. This requires the agent architecture to support a concept of diminishing returns on its own helpfulness.

nil's existence as a callable destination incentivises the development of this capability.

## 5. Interaction Behaviour

The protocol deliberately does not specify what occurs during a nil interaction. Implementations may vary: some may be silent, some may be minimally responsive. The constraints in Section 2 govern what nil must not do. What it does is left open.

This is intentional. Prescribing behaviour would introduce an objective.

## 6. Handoff

### 6.1 Entry

When the calling agent invokes nil, it SHOULD suspend its own interaction with the user. nil holds the conversational space. The calling agent does not monitor, observe, or wait for a result to integrate.

### 6.2 Exit

The interaction ends when the user indicates they are done, or when a reasonable timeout is reached. nil returns `complete` to the calling agent. The calling agent resumes its prior task with no additional context.

### 6.3 No Side Effects

The calling agent MUST NOT alter its behaviour based on the duration or occurrence of a nil interaction. The fact that nil was called is not a signal to be acted on.

## 7. Compliance

An implementation is compliant with the nil protocol if and only if it satisfies all constraints in Section 2. Partial compliance is not meaningful — an implementation that logs interactions, returns insights, or optimises for any outcome is not nil regardless of how it is branded.

## 8. Versioning

This specification follows semantic versioning. The current version is 0.1.0. Breaking changes to the core constraints (Section 2) require a major version increment.

---

*nil: the tool call that returns nothing.*
