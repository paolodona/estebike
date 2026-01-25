---
name: issue-start
description: Start working on a GitHub Issue. Creates a branch from issue number and updates issue status.
---

## Usage

`/issue-start <issue-number>` - Start working on a GitHub issue
`/issue-start <issue-number> --plan` - Start and create an implementation plan

## Process

### Step 1: Fetch Issue Details

Run this command to get issue information:

```bash
gh issue view <issue-number> --json number,title,body,labels,state
```

Parse the response to extract:
- Issue number
- Issue title
- Issue body (for plan context)
- Current labels
- State (should be "open")

If the issue doesn't exist or is closed, inform the user and stop.

### Step 2: Generate Branch Name

Create branch name from issue:
- Format: `<issue-number>-<slugified-title>`
- Slugify: lowercase, replace spaces with hyphens, remove special chars, max 50 chars
- Example: Issue #45 "Echo bug causes title flickering" → `45-echo-bug-causes-title-flickering`

### Step 3: Create and Checkout Branch

```bash
git checkout -b <branch-name>
```

If the branch already exists, ask user if they want to:
- Switch to existing branch: `git checkout <branch-name>`
- Delete and recreate: `git branch -D <branch-name> && git checkout -b <branch-name>`

### Step 4: Update Issue Labels

Add "in-progress" label to the issue:

```bash
gh issue edit <issue-number> --add-label "in-progress"
```

If the label doesn't exist, create it first:
```bash
gh label create "in-progress" --color "fbca04" --description "Currently being worked on" 2>/dev/null || true
```

### Step 5: Create Plan (if --plan flag)

If the `--plan` flag was provided, delegate to the full `/create-plan` workflow:

1. Extract a short plan name from the issue title (e.g., "fix-echo-bug")

2. Invoke the `/create-plan` skill with the issue number prefix:
   ```
   /create-plan <issue-number>-<plan-name>: <issue-title>
   ```

   Example: For Issue #45 "Echo bug causes title flickering":
   ```
   /create-plan 45-fix-echo: Echo bug causes title flickering
   ```

This ensures the full planning workflow is used, including:
- EnterPlanMode for user approval
- Comprehensive research with specialized agents
- All three plan files (prompt, context, plan)
- GitRef tracking for staleness detection
- ExitPlanMode for final approval

### Step 6: Output Summary

Display to the user:

```
Started work on Issue #<number>: <title>

Branch: <branch-name>
Labels: <labels> + in-progress

<if --plan>
Plan created: .agent_session/<NNN>_<plan-name>_plan.md
</if>

Next steps:
1. Implement the fix/feature
2. Use conventional commits: fix: or feat:
3. When ready, run /issue-pr to create a pull request
```

## Examples

```
/issue-start 45
→ Creates branch 45-echo-bug-title-flickering
→ Adds in-progress label
→ Ready to code

/issue-start 45 --plan
→ Creates branch 45-echo-bug-title-flickering
→ Adds in-progress label
→ Invokes /create-plan 45-fix-echo: Echo bug causes title flickering
→ Full planning workflow (EnterPlanMode, research, ExitPlanMode)
```

## Error Handling

- **Issue not found**: "Issue #X does not exist. Check the issue number."
- **Issue closed**: "Issue #X is already closed. Reopen it first or pick a different issue."
- **Branch exists**: Ask user to switch or recreate
- **Not on main**: Warn user they're branching from non-main branch
