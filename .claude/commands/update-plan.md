---
name: update-plan
description: Updates an existing plan by analyzing code changes since the plan was created. Useful when plans become stale before implementation.
---

# Update Plan

You are tasked with refreshing a stale implementation plan. Plans track the git revision (`GitRef`) when they were created. This command analyzes what changed in the codebase since then and helps update the plan accordingly.

## Command Format

`/update-plan <plan-name-or-number>`

## When to Use

- Before implementing a plan that was created several commits ago
- When `/list-plans` shows a plan is "N commits behind"
- After a major refactoring that may have invalidated earlier plans
- When you're unsure if a plan's file references are still accurate

---

## Update Process

### Step 1: Find and Read the Plan

1. **Locate the plan files**: Use Glob to find all plan files:
   - `.agent_session/<NNN>_<name>_prompt.md` - Original mission/task
   - `.agent_session/<NNN>_<name>_context.md` - Research findings
   - `.agent_session/<NNN>_<name>_plan.md` - Implementation steps
2. **Read all files**: Load the prompt, plan and context fully into memory
3. **Extract GitRef**: Parse the header line for the `GitRef: <sha>` field
   - Header format: `Plan: <NNN> | Name: <name> | Created: <date> | Status: <status> | GitRef: <sha>`
4. **Note the original mission**: The `_prompt.md` file contains what the user originally asked for - keep this in mind when updating

If the plan has no GitRef (older plan format):

```
⚠️ This plan was created before GitRef tracking was added.
Cannot determine what changed. Options:
1. Manually review the plan against current codebase
2. Create a fresh plan with `/create-plan`
```

### Step 2: Analyze Code Changes

1. **Count commits behind**:

   ```bash
   git rev-list --count <gitref>..HEAD
   ```

2. **Get changed files since plan creation**:

   ```bash
   git diff --name-only <gitref>..HEAD
   ```

3. **Extract files mentioned in the plan**: Parse the plan for file paths mentioned in the implementation steps

4. **Find overlap**: Identify which files mentioned in the plan have been modified since creation

5. **Get detailed changes for overlapping files**:
   ```bash
   git diff <gitref>..HEAD -- <file1> <file2> ...
   ```

### Step 3: Generate Change Report

Present the analysis to the user:

```markdown
## Plan Update Analysis: <plan-name>

**Plan created**: <date> at GitRef `<sha>`
**Current HEAD**: `<current-sha>`
**Commits behind**: N

### Files Modified Since Plan Creation

**Directly mentioned in plan (REQUIRES REVIEW):**

- `path/to/file.ts` - [summary of changes from diff]
- `path/to/other.rs` - [summary of changes from diff]

**Other files changed (may affect plan):**

- `related/file.ts` - [brief description]

### Recommended Actions

1. [ ] Review changes to `path/to/file.ts` - lines X-Y in Phase 2 may need updating
2. [ ] Verify `SomeType` still exists in the types module
3. [ ] Check if new utility can be reused
```

### Step 4: Interactive Update

Ask the user how to proceed:

**Option A: Update the existing plan**

- Walk through each phase, highlighting what needs to change
- Update file paths, line numbers, and code snippets
- Update the `GitRef` in the header to current HEAD

**Option B: Mark as obsolete and create new plan**

- Rename existing plan: `<NNN>_<name>_plan.md` → `<NNN>_<name>_plan.obsolete.md`
- Suggest running `/create-plan <name>: <updated description>`

**Option C: Plan is still valid**

- Just update the `GitRef` to current HEAD
- No other changes needed

### Step 5: Update GitRef

After any update, update the plan header with the new GitRef:

```markdown
# Implementation Plan: [Feature Name]

Plan: <NNN> | Name: <plan-name> | Created: YYYY-MM-DD | Status: PLANNED | GitRef: <new-sha>
```

Also update `.agent_session/SUMMARY.md`:

- Find the row for this plan
- Update GitRef column to `<new-sha>`
- Update Last Updated column to current date

Also add a note to the context file:

```markdown
## Update History

- **YYYY-MM-DD**: Updated from GitRef `<old-sha>` to `<new-sha>`. [Brief description of changes]
```

---

## Example Session

```
User: /update-plan 078

Claude: Reading plan 078 (feature-name)...

## Plan Update Analysis: feature-name

**Plan created**: 2025-12-25 at GitRef `e14e34a`
**Current HEAD**: `abc1234`
**Commits behind**: 5

### Files Modified Since Plan Creation

**Directly mentioned in plan (REQUIRES REVIEW):**
- `src/types/model.ts` - Added new field (unrelated to this plan)
- `src/api/endpoint.ts` - Refactored function signature

**Other files changed (may affect plan):**
- `src/utils/helper.ts` - Minor fix

### Recommended Actions

1. [x] Review endpoint changes - Phase 2 references line 476, now at line 492
2. [ ] Verify function still accepts the parameters described

How would you like to proceed?
- **A**: Update the existing plan (recommended - changes are minor)
- **B**: Mark as obsolete and create fresh
- **C**: Plan is still valid, just update GitRef
```

---

## Important Notes

- This command does NOT implement anything - it only updates the plan document
- Always verify updated line numbers by reading the actual files
- For large changes, creating a fresh plan may be cleaner than patching
- The update history in the context file helps track plan evolution
