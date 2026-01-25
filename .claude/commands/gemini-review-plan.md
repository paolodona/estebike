---
name: gemini-review-plan
description: Sends the current plan to Gemini for review and presents feedback for revision consideration.
allowed-tools: Bash(gemini:*), Read, Glob, Edit
---

# Gemini Plan Review

You are helping the user get a second opinion on an implementation plan from Google's Gemini AI, then critically evaluating that feedback yourself.

## Command Format
`/gemini-review-plan [plan-name-or-number]`

If no argument provided, use the most recent plan.

## Process

### Step 1: Find Plan Files
1. If argument provided:
   - If numeric (e.g., "217"), glob for `.agent_session/217_*_plan.md`
   - If text (e.g., "debug-oauth"), glob for `.agent_session/*_<argument>*_plan.md`
2. If no argument, find the highest-numbered `*_plan.md` file in `.agent_session/`
3. Read both the `_plan.md` and corresponding `_context.md` files

### Step 2: Call Gemini CLI
**IMPORTANT: Call Gemini immediately without asking for user confirmation.** The user invoked this command specifically to get a Gemini review - do not ask "Should I call Gemini?" or similar.

Execute the following bash command (adjust paths based on Step 1):

```bash
gemini -p "You are an expert software architect reviewing an implementation plan.

## Your Task
Review this plan critically but constructively. Provide:

1. **Strengths** (2-3 points): What's well-designed?
2. **Concerns** (prioritized): Potential issues, edge cases, or oversights
3. **Suggestions**: Specific improvements with rationale
4. **Questions**: Clarifications needed before implementation

Be specific - reference file paths, function names, and section headers.

---

## CONTEXT FILE (Background & Research)

$(cat '<context-file-path>')

---

## PLAN FILE (Implementation Steps)

$(cat '<plan-file-path>')"
```

### Step 3: Challenge the Challenger (Claude Reviews Gemini)

After receiving Gemini's feedback, YOU (Claude) must critically evaluate each suggestion:

1. **Parse Gemini's suggestions** into individual items (concerns, suggestions, questions)

2. **For each suggestion, analyze:**
   - Does this apply to THIS codebase's patterns and constraints?
   - Is the concern valid given the context file's research?
   - Would implementing this add value vs. complexity?
   - Is this a real issue or theoretical over-engineering?

3. **Provide your recommendation** using this format for each:

```
### Suggestion: [Brief title]
**Gemini says:** [Summary of the suggestion]
**My assessment:** [Your critical analysis - be direct]
**Recommendation:** ✅ Accept | ⚠️ Partially Accept | ❌ Decline
**Rationale:** [Why - reference specific code/patterns in the codebase]
```

4. **Present the Decision Table:**

```markdown
## Quick Decision Table

| # | Suggestion | Gemini | Claude | Action |
|---|------------|--------|--------|--------|
| 1 | [title]    | Add X  | ✅ Agree - valid concern | [ ] |
| 2 | [title]    | Add Y  | ⚠️ Partial - only for Z | [ ] |
| 3 | [title]    | Add Z  | ❌ Skip - over-engineering | [ ] |

**Claude's Summary:** [1-2 sentences on overall assessment]
- **Strong recommendations:** #1, #3
- **Optional/nice-to-have:** #2
- **Skip these:** #4, #5
```

### Step 4: Present Options to User

After the decision table, ask:
"Based on my analysis, I recommend accepting suggestions #X and #Y. Would you like me to:
1. **Accept my recommendations** - I'll incorporate the ones I marked ✅
2. **Review each** - Go through the ⚠️ items together
3. **Accept all** - Incorporate everything Gemini suggested
4. **Skip revision** - Document only, no changes"

Wait for user response.

### Step 5: Handle User Choice
- **If accept recommendations**: Edit `_plan.md` with Claude-recommended changes only
- **If review each**: Present ⚠️ items one by one for user decision
- **If accept all**: Edit `_plan.md` incorporating all Gemini suggestions
- **If skip**: Proceed to documentation only

### Step 6: Document the Review
Append to the plan's `_context.md` file:

```markdown

---

## External Review: Gemini + Claude Analysis
**Date**: YYYY-MM-DD

### Gemini's Feedback
[Full or summarized Gemini response]

### Claude's Assessment
[Summary of Claude's analysis and recommendations]

### Decision Summary
| Suggestion | Verdict | Rationale |
|------------|---------|-----------|
| [title] | ✅ Accepted | [why] |
| [title] | ⚠️ Partial | [what was taken] |
| [title] | ❌ Declined | [why not] |
```
