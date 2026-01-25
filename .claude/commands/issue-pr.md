---
name: issue-pr
description: Create a Pull Request that closes the GitHub Issue associated with the current branch.
---

## Usage

`/issue-pr` - Create a PR linking to the issue from branch name
`/issue-pr --draft` - Create a draft PR

## Process

### Step 1: Detect Issue Number from Branch

Get the current branch name:

```bash
git branch --show-current
```

Parse the issue number:
- Branch `45-echo-fix` → Issue #45
- Branch `123-add-pdf-export` → Issue #123
- If no number prefix, ask user: "Which issue does this PR close?"

### Step 2: Check for Uncommitted Changes

```bash
git status --porcelain
```

If there are uncommitted changes, ask user:
- "You have uncommitted changes. Commit them first?"
- If yes, run `/commit` flow
- If no, continue (changes won't be in PR)

### Step 3: Push Branch to Remote

Check if branch is pushed:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
```

If not tracking remote, push:

```bash
git push -u origin <branch-name>
```

### Step 4: Fetch Issue Details

```bash
gh issue view <issue-number> --json title,body,labels
```

### Step 5: Analyze Changes for PR Body

Get the diff summary:

```bash
git log main..<branch> --oneline
git diff main..<branch> --stat
```

Generate a summary of:
- What changed (based on commits and files)
- Key files modified
- Type of change (fix, feature, refactor)

### Step 6: Generate PR Body

Create the PR body:

```markdown
## Summary

<AI-generated 2-3 sentence summary based on commits and diff>

## Changes

<Bulleted list of key changes with file references>

## Testing

- [ ] Tests pass locally
- [ ] Manual testing completed

## Issue

Fixes #<issue-number>

---
Generated with [Claude Code](https://claude.ai/code)
```

### Step 7: Create Pull Request

```bash
gh pr create \
  --title "<issue-title>" \
  --body "<generated-body>" \
  [--draft]
```

### Step 8: Output Summary

```
Pull Request created!

PR: <pr-url>
Title: <title>
Closes: Issue #<number>

The PR will:
- Run CI tests automatically
- Auto-close Issue #<number> when merged
- Trigger version bump based on commit messages

Next steps:
1. Review the PR on GitHub
2. Address any CI failures
3. Request review if needed
4. Merge when ready
```

## Conventional Commit Reminder

Before creating the PR, remind the user about commit message format:

```
Tip: Your commit messages determine the version bump:
- fix: ... → patch (0.3.2 → 0.3.3)
- feat: ... → minor (0.3.2 → 0.4.0)
- BREAKING CHANGE: ... → major (0.3.2 → 1.0.0)
- chore: / docs: → no version bump
```

## Error Handling

- **No issue number in branch**: Ask user for issue number
- **Issue doesn't exist**: "Issue #X not found. Create PR without issue link?"
- **Branch not pushed**: Auto-push with `-u origin`
- **PR already exists**: "PR #Y already exists for this branch: <url>"
- **No commits ahead of main**: "No changes to create PR for"

## Examples

```
/issue-pr
→ Detects branch 45-echo-fix
→ Pushes if needed
→ Creates PR "Echo bug causes title flickering"
→ Body includes "Fixes #45"
→ Returns PR URL

/issue-pr --draft
→ Same as above but PR is marked as draft
```
