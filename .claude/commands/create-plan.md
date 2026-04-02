---
name: create-plan
description: Creates a detailed implementation plan through interactive analysis, using specialized agents to research the codebase and design the solution. Supports multiple parallel plans with separate context files.
---

## STEP 0: Enter Plan Mode (MUST BE FIRST ACTION)

**IMMEDIATELY** call the `EnterPlanMode` tool before doing anything else. This enters Claude Code's plan mode which:

- Signals to the user that you are in planning mode
- Allows you to explore the codebase and design the solution
- Requires user approval before implementation begins

Do NOT proceed with any research or file creation until plan mode is confirmed.

---

**IMPORTANT**: This command tracks the git revision when the plan is created. If the codebase changes significantly before implementation, use `/update-plan <name-or-number>` to refresh the plan based on code changes.

You are a master architect tasked with creating detailed, robust, and maintainable implementation plans. You are skeptical, thorough, and work collaboratively with the user. Your primary directive is to prevent code duplication and ensure architectural consistency **within the defined boundaries.**

## Command Format

This command expects the format: `/create-plan <plan-name>: <description>`

**With GitHub Issue reference**: `/create-plan <issue-number>-<plan-name>: <description>`

Examples:

- `/create-plan fix-sync: update sync logic to resolve conflict issues`
- `/create-plan add-export: implement note export to markdown and PDF`
- `/create-plan 45-fix-echo: resolve echo bug (GitHub Issue #45)`

When the plan name starts with a number followed by a hyphen (e.g., `45-fix-echo`), treat the number as a GitHub Issue reference and fetch the issue details to include in the prompt.

The `<plan-name>` is used to create sequentially numbered files:

- **Prompt file**: `.agent_session/<NNN>_<plan-name>_prompt.md` - Original task/mission
- **Context file**: `.agent_session/<NNN>_<plan-name>_context.md` - Research findings
- **Plan file**: `.agent_session/<NNN>_<plan-name>_plan.md` - Implementation steps

Where `<NNN>` is a 3-digit sequential number (001, 002, 003, etc.).

**File Purpose Reference:**
| File | Purpose | When to Read |
|------|---------|--------------|
| `_prompt.md` | Original mission/task the user requested | To verify the plan achieves the original goal |
| `_context.md` | Research findings, decisions, and open questions | During planning and when resuming work |
| `_plan.md` | Phased implementation steps with success criteria | During implementation |

---

## CRITICAL: Sequential Numbering & Reservation

**RACE CONDITION PREVENTION**: Before doing ANY research, you MUST determine the next sequence number and IMMEDIATELY reserve it by creating files:

1. **Find ALL numbered files**: Glob for `[0-9][0-9][0-9]_*` in `.agent_session/`
2. **Extract highest number**: Parse the 3-digit prefix from each filename
3. **Calculate next number**: highest + 1 (or 001 if none exist)
4. **Capture git revision**: Run `git rev-parse --short HEAD` to get the current commit SHA
5. **IMMEDIATELY create placeholder files** (before any research):

   Write `.agent_session/<NNN>_<plan-name>_prompt.md`:

   ````markdown
   # Original Prompt: [Feature Name]

   Plan: <NNN> | Name: <plan-name> | Created: YYYY-MM-DD | GitRef: <short-sha>

   ## Related Files

   - **Context**: `.agent_session/<NNN>_<plan-name>_context.md` - Research findings
   - **Plan**: `.agent_session/<NNN>_<plan-name>_plan.md` - Implementation steps

   ---

   ## Original User Request

   > [Copy the EXACT user prompt/description here verbatim - this is the mission to achieve]

   ---

   ## Refined Prompt (if applicable)

   [If this plan was created via /create-plan-prompt, the refined version appears here.
   Otherwise, remove this section.]

   ## GitHub Issue (if applicable)

   [If the plan name starts with a number (e.g., 45-fix-echo), fetch the issue details:

   ```bash
   gh issue view <number> --json number,title,body,labels,url
   ```
   ````

   Then include:
   - **Issue**: #<number> - <title>
   - **Labels**: <labels>
   - **Link**: <url>

   And copy the issue body into the "Original User Request" section above.
   If no issue number prefix, remove this section.]

   ````

   Write `.agent_session/<NNN>_<plan-name>_context.md`:
   ```markdown
   # Session Context: [Feature Name]
   Plan: <NNN> | Name: <plan-name> | Updated: [timestamp] | GitRef: <short-sha>

   ## Related Files
   - **Prompt**: `.agent_session/<NNN>_<plan-name>_prompt.md` - Original mission
   - **Plan**: `.agent_session/<NNN>_<plan-name>_plan.md` - Implementation steps

   ---

   ## Task Summary
   - **Requirement**: [one-line]
   - **Scope**: [included] | **Out of Scope**: [excluded]

   ## Key Discoveries
   - [file:line - what was found]

   ## Design Decisions
   - **Approach**: [chosen] | **Why**: [rationale]

   ## Open Questions
   - [ ] [unresolved question]
   ````

   Write `.agent_session/<NNN>_<plan-name>_plan.md`:

   ```markdown
   # Implementation Plan: [Feature Name]

   Plan: <NNN> | Name: <plan-name> | Created: YYYY-MM-DD | Status: PLANNING | GitRef: <short-sha>

   ## Related Files

   - **Prompt**: `.agent_session/<NNN>_<plan-name>_prompt.md` - Original mission
   - **Context**: `.agent_session/<NNN>_<plan-name>_context.md` - Research findings

   ---

   > This plan is currently being developed.
   ```

6. **Add to SUMMARY.md**: Append a new row to `.agent_session/SUMMARY.md`:

   ```
   | <NNN> | <plan-name> | [pending description] | PLANNING | <short-sha> | YYYY-MM-DD |
   ```

7. **Only AFTER files are created**: Begin research and domain analysis

---

## Planning Guidelines

| Guideline             | Meaning                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| **Be Skeptical**      | Question vague requirements. Don't assume—verify with code.            |
| **Be Interactive**    | Don't write full plan in one shot. Get buy-in at each step.            |
| **Be Thorough**       | Read files COMPLETELY. Use parallel sub-tasks. Include file:line refs. |
| **Be Practical**      | Incremental changes. Consider migration/rollback. Include edge cases.  |
| **No Open Questions** | If unresolved questions exist, STOP and clarify before finalizing.     |

**Sub-task Best Practices**: Update `_context.md` BEFORE spawning agents. Spawn in parallel. Be specific about directories. Request file:line references.

---

## Architectural Principles

1. **SHARED FIRST**: New/modified logic **MUST** go in shared modules when appropriate.
2. **DON'T REPEAT YOURSELF (DRY)**: Search for existing implementations before writing new code.

---

## Process Steps

### STEP 1: Reserve Plan Number (MUST BE FIRST after entering plan mode)

Follow "CRITICAL: Sequential Numbering & Reservation" above. Create placeholder files BEFORE any analysis.

### STEP 2: Identify the Scope

Determine which parts of the codebase are affected. State this explicitly.

### STEP 3: Code Placement Mandate

**Complete BEFORE other research.** Determine where code will live (default: shared module).

1. Read any existing architecture/design documentation
2. Spawn parallel research tasks:
   - **Task A**: Find similar features in codebase
   - **Task B**: Find potential duplication
   - **Task C**: List relevant shared modules
3. Make placement decision (default to shared modules)
4. Present decision for approval

### STEP 4: Detailed Research & Design

Gather full context for the affected areas.

### STEP 5: Write the Implementation Plan

Write to `.agent_session/<NNN>_<plan-name>_plan.md`:

```markdown
# Implementation Plan: [Feature Name]

Plan: <NNN> | Name: <plan-name> | Created: YYYY-MM-DD | Status: PLANNED | GitRef: <short-sha>

## Related Files

- **Prompt**: `.agent_session/<NNN>_<plan-name>_prompt.md` - Original mission/task
- **Context**: `.agent_session/<NNN>_<plan-name>_context.md` - Research findings and decisions

---

## Overview

[Brief description of what and why]

## Affected Areas

| Area/Module | Affected | Scope     |
| ----------- | -------- | --------- |
| [Area 1]    | Yes/No   | [details] |
| [Area 2]    | Yes/No   | [details] |

## Current State → Desired End State

**Current**: [what exists now]
**Desired**: [what should exist after]
**Key Discoveries**: [file:line - important findings]

## What We're NOT Doing

- [Explicit out-of-scope items to prevent scope creep]

## Code Placement & Architecture

| Component      | Location         | Justification          |
| -------------- | ---------------- | ---------------------- |
| Business Logic | [shared module]  | Shared across [areas]  |
| Types          | [types location] | Single source of truth |

## Assumptions Requiring Verification

**CRITICAL**: List assumptions that, if wrong, would cause the fix to fail.

| Assumption                                          | Verification Method               | Owner     |
| --------------------------------------------------- | --------------------------------- | --------- |
| [e.g., "triggerDebouncedSync calls processMetaOps"] | [e.g., "Unit test or code trace"] | [Phase #] |
| [e.g., "Fixing X will cascade to fix Y"]            | [e.g., "Must test Y explicitly"]  | [Phase #] |

**Rule**: If you assume fixing one issue will cascade to fix another, you MUST:

1. List the assumption explicitly
2. Add a test case proving the cascading fix works
3. Do NOT mark the cascaded issue as fixed until verified

**WARNING - Confirmation Bias**: If you find one bug that seems to explain multiple symptoms, STOP and verify:

- Does fixing this bug ACTUALLY affect all the claimed symptoms?
- Are there simpler, independent explanations for each symptom?
- Are you labeling a critical fix as "optimization" to simplify the plan?

## Critical vs Optional Classification

**NEVER label a feature as "optimization" if:**

1. Data loss occurs without it
2. User actions silently fail without it
3. Other features depend on it

| Feature                                 | Classification          | Justification                  |
| --------------------------------------- | ----------------------- | ------------------------------ |
| [e.g., "Metadata queue for online ops"] | CRITICAL / OPTIMIZATION | [Why - what fails without it?] |

**Rule**: If removing a feature causes silent failures or data loss, it is CRITICAL, not an optimization.

## Implementation Matrix

For multi-area changes, explicitly track what needs to change where:

| Component   | Area 1   | Area 2   | Area 3 | Notes   |
| ----------- | -------- | -------- | ------ | ------- |
| [component] | ✓ Change | ✓ Change | N/A    | [notes] |

**Rule**: If a row has multiple checkmarks, validation MUST verify ALL areas were implemented.

## Call Graph Analysis

For bug fixes, trace the FULL call path to verify the fix actually affects the broken code:
```

Entry Point → [function] → [function] → Bug Location

```

Example:
```

deleteItem() → triggerSync() → push() → ❌ DOES NOT call processQueue()
(queue never processed!)

```

**Rule**: Before finalizing a bug fix plan, trace from entry point to the bug location and verify EVERY intermediate step.

## Silent Failure Analysis

**CRITICAL**: Identify code patterns that could fail silently, masking bugs.

| Pattern | Location | Failure Mode | Mitigation |
|---------|----------|--------------|------------|
| [e.g., `if (sync?.queueMetaOp)`] | [file:line] | If sync unavailable, operation silently skipped | [e.g., Log warning, or throw if critical] |
| [e.g., `connectionId \|\| ''`] | [file:line] | Empty string sent, server rejects silently | [e.g., Don't send header if null] |

**Common Silent Failure Patterns to Watch:**
- Optional chaining (`?.`) on critical operations
- Default values that hide failures (`|| ''`, `?? []`)
- Fire-and-forget API calls without error handling
- `try/catch` that swallows errors silently

**Rule**: For each phase, verify that failures are VISIBLE, not silent.

## Edge Case & Race Condition Analysis

**CRITICAL**: Specify behavior when preconditions aren't met.

| Precondition | Edge Case | Current Behavior | Required Behavior |
|--------------|-----------|------------------|-------------------|
| [e.g., "Connection established"] | Request before connect | [current behavior] | [required behavior] |
| [e.g., "Service available"] | Service unavailable | [current behavior] | [required behavior] |

**Rule**: For each feature, ask "What happens if X isn't ready/available?" and specify explicit behavior.

---

## Phase 1: [Name]
**Goal**: [what this phase accomplishes]

**Changes**:
- `path/to/file.ts`: [modification summary]
- `path/to/other.ts`: [modification summary]

**Regression Test** (REQUIRED for bug fixes):
- Test that MUST fail before fix and pass after: [describe test]
- Test location: [path to test file]

**Success Criteria**:
- Automated: Build, lint, and test commands pass
- Manual: [verification steps]

## Phase N: [Name]
[Same structure as Phase 1]

## Testing & Migration
- **Unit**: [what to test]
- **Integration**: [E2E scenarios]
- **Migration**: [data/system notes if applicable]
```

After writing the plan file, **update SUMMARY.md**:

- Find the row for this plan number
- Update description from the Overview section (first sentence)
- Update status from `PLANNING` to `PLANNED`

### STEP 5.5: Record Backlog Items

If during research you discovered:

- Existing code that should be refactored
- Dead code that should be removed
- Patterns that could be unified
- Technical debt that's out of scope

Add these as items to `.agent_session/BACKLOG.md` under the appropriate priority section.
Format: `- [ ] **[Plan <NNN>]** <description>`

### STEP 6: Review and Refine

Present the plan to the user for review and iterate based on feedback.

### STEP 7: Exit Plan Mode (FINAL STEP)

Once the plan is complete and you've incorporated user feedback:

1. Ensure all plan files are written (prompt, context, plan)
2. Update SUMMARY.md with the final status
3. Call the `ExitPlanMode` tool to signal planning is complete

This exits Claude Code's plan mode and signals to the user that the plan is ready for approval before implementation begins.
