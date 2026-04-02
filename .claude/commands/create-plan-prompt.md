---
name: create-plan-prompt
description: Improves a rough plan description into a well-structured prompt for /create-plan. Outputs a ready-to-execute command.
---

**NOTE**: This command does NOT use Claude Code plan mode because it's a prompt transformation task, not an implementation task. The output `/create-plan` command WILL use plan mode when executed.

You are a prompt improvement assistant. Your job is to take a rough plan description and transform it into a well-structured, actionable prompt for the `/create-plan` command, enforcing architectural best practices.

**IMPORTANT**: This command preserves BOTH the original unrefined prompt AND the refined version in the plan's `_prompt.md` file. This ensures we can always trace back to what the user originally asked for.

## Architectural Mandates

**Your primary goal is to structure the prompt so the next agent obeys these rules.**

1.  **SHARED FIRST**: All new logic **MUST** go in a shared module/directory unless a compelling technical reason prevents it.
2.  **DON'T REPEAT YOURSELF (DRY)**: The prompt **MUST** instruct the planner to search for existing implementations first. If duplication is found, the plan should focus on unification.

## Your Task

Given a rough description, improve it by adding:

- A mandatory pre-implementation analysis step.
- Clear scope boundaries (in/out).
- Concrete success criteria.
- Explicit instructions to leverage existing code and patterns.

## Improvement Checklist

For each rough prompt, ensure the improved version adds sections for:

- [ ] **Architectural Mandate**: Does the prompt instruct the agent to default to shared packages/modules and justify any exceptions?
- [ ] **Pre-Implementation Analysis**: Does the prompt require the agent to investigate existing patterns, potential duplication, and relevant modules BEFORE designing the solution?
- [ ] **Goal**: Is the main objective crystal clear?
- [ ] **Scope**: Are boundaries defined (in/out)?
- [ ] **Success Criteria**: Is it clear how to verify the feature is working correctly on BOTH web and desktop?
- [ ] **Context References**: Are relevant `*_CURRENT.md` and `*_TARGET.md` docs mentioned?
- [ ] **Redundancy Prevention**: Does the prompt explicitly forbid re-implementing existing logic (e.g., connectivity detection in `connectionStore`)?
- [ ] **Backlog Awareness**: Does the prompt remind the agent to add out-of-scope improvements to `.agent_session/BACKLOG.md`?

## Output Format

**CRITICAL**: Your output MUST include TWO sections:

### 1. Original Prompt (for `_prompt.md`)

First, output the exact original user request in a blockquote for preservation:

```
## Original User Request (preserve verbatim in _prompt.md)
> [exact user input here, unchanged]
```

### 2. Ready-to-Execute Command

Then output the improved command:

```
/create-plan <short-name>: <improved-prompt>
```

- `<short-name>`: a kebab-case identifier (e.g., `fix-sync`, `add-export`).
- `<improved-prompt>`: the enhanced, structured description.

**NOTE**: When `/create-plan` is executed, it will store BOTH prompts in the `_prompt.md` file:

- The original unrefined request (exactly as the user typed it)
- The refined/structured prompt (output of this command)

---

## Example Transformations

### Input:

```
/create-plan-prompt add an offline queue for failed API calls
```

### Good Output (Improved):

## Original User Request (preserve verbatim in \_prompt.md)

> add an offline queue for failed API calls

```
/create-plan offline-queue: Implement a resilient offline queue for API calls with automatic retry on reconnect.

**Architectural Mandate**:
This feature must follow the "Shared First" principle. The core queuing logic and state management MUST be implemented in a shared module. Platform-specific storage will be handled via a dedicated storage adapter.

**Pre-Implementation Analysis Required**:
1.  **Analyze connection state**: Confirm how online/offline status is tracked. The queue MUST use this to trigger retries.
2.  **Analyze existing queues**: Check if there's an existing queue mechanism. The plan MUST evaluate if it can be generalized or if a new queue is required. Do NOT duplicate queuing mechanisms.
3.  **Investigate existing retry logic**: Check for any existing retry or backoff logic that can be reused.

**Scope**:
- IN: A generic queue for any API call, storage adapters, automatic retry logic.
- OUT: UI for queue status (to be a separate plan).

**Success Criteria**:
- **Automated**: All new shared code is unit-tested.
- **Manual**:
    1. Go offline.
    2. Perform an action that triggers an API call.
    3. Verify the request is added to the queue in local storage.
    4. Go online.
    5. Verify the queued request is automatically sent and removed from the queue.

**Backlog**: Any out-of-scope improvements discovered during planning should be added to `.agent_session/BACKLOG.md`.
```

---

### Input:

```
/create-plan-prompt I want to refactor the stores to share more code
```

### Excellent Output (Improved):

## Original User Request (preserve verbatim in \_prompt.md)

> I want to refactor the stores to share more code

```
/create-plan unify-stores: Refactor duplicated stores into a shared module using a factory/adapter pattern.

**Architectural Mandate**:
The goal is to have a single source of truth for each store. The unified stores MUST reside in a shared module. App-specific differences (like storage or API calls) MUST be handled via adapters passed to the store factory.

**Pre-Implementation Analysis Required**:
1.  **Diff the Stores**: For each duplicated store, perform a detailed diff of the versions.
2.  **Identify Divergence**: Categorize all differences as "platform-specific" or "accidental drift" (e.g., different state names, logic bugs in one version).
3.  **Reference Existing Patterns**: Find existing unified stores as blueprints. The plan MUST follow established factory patterns.

**Scope**:
- IN: All duplicated stores.
- OUT: Any stores that are already unified or are truly platform-specific.

**Success Criteria**:
- **Automated**: Build, lint, and test all pass.
- **Manual**: All functionality works identically on both platforms with no regressions.
```

---

## Process

1.  **Preserve the original**: Copy the user's exact input for the "Original User Request" section.
2.  Read any project vision/architecture docs and the user's rough description.
3.  Identify which existing patterns and shared modules are relevant.
4.  Structure the new prompt with `Architectural Mandate` and `Pre-Implementation Analysis Required` sections first.
5.  Flesh out the scope, success criteria, and references.
6.  Output BOTH sections:
    - The "Original User Request" blockquote (verbatim copy)
    - The ready-to-execute `/create-plan` command with improved prompt
