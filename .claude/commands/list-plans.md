---
name: list-plans
description: Lists all implementation plans with their status (Planned, Implemented, Verified) and a short description.
---

# List Plans

You are tasked with listing all implementation plans stored in the `.agent_session/` directory, along with GitHub issues, cross-referencing them where applicable.

## Command Format

`/list-plans` (no arguments)

## Process

### Step 1: Read SUMMARY.md and Validate

1. Read `.agent_session/SUMMARY.md`
2. If it doesn't exist, go to Step 2 (Full Scan)
3. Parse the markdown table to extract plan entries
4. Run `Glob` for `.agent_session/*_plan.md` to get actual plan files
5. **Validate**: Compare SUMMARY.md entries against actual files:
   - Missing plans: Files exist but not in SUMMARY.md
   - Orphan entries: SUMMARY.md entries without corresponding files
6. If **validation passes** (no missing/orphan): Use SUMMARY.md data, skip to Step 3
7. If **validation fails**: Go to Step 2 (Full Scan) to repair

### Step 2: Full Scan (Fallback/Repair)

Only execute if SUMMARY.md is missing, malformed, or out of sync:

1. Find all `*_plan.md` files in `.agent_session/` using Glob
2. For each file, read the first 20 lines and extract:
   - **Number and Name**: From filename `<NNN>_<plan-name>_plan.md`
   - **Header line**: `Plan: NNN | Name: name | Created: date | Status: STATUS | GitRef: sha`
   - **Description**: First sentence from the "Overview" section
3. Check if corresponding `*_prompt.md` file exists for each plan
4. Build complete plan list from scanned data
5. **Update SUMMARY.md**: Write the repaired/complete data:

```markdown
# Plan Summary

Last updated: <today's date YYYY-MM-DD>

| #   | Plan Name    | Description            | Status  | GitRef  | Last Updated |
| --- | ------------ | ---------------------- | ------- | ------- | ------------ |
| 078 | example-plan | Short description here | PLANNED | abc1234 | 2025-12-30   |
```

6. Report that SUMMARY.md was updated

### Step 3: Fetch GitHub Issues

1. Run `gh issue list --limit 50 --json number,title,labels` to get open issues
2. Parse the JSON output to extract issue data
3. Build a lookup map: `issueNumber -> { title, labels }`

### Step 4: Cross-Reference Plans and Issues

Plans can be linked to issues via naming convention: `<NNN>_<issue#>-<description>_plan.md`

For each plan:

1. Parse the plan name to check if it starts with a number (e.g., `45-fix-echo`)
2. If it does, look up that issue number in the GitHub issues map
3. Mark both the plan and issue as "linked"

### Step 5: Check Staleness and Display

For each plan:

1. If GitRef exists and status is PLANNED: Run `git rev-list --count <gitref>..HEAD` (no cd prefix, no error redirection - just the simple command)
2. Format output with status emoji and staleness warning if applicable
3. If plan is linked to an issue, show issue reference

## Status Values

| Status        | Emoji | Meaning                                         |
| ------------- | ----- | ----------------------------------------------- |
| `VALIDATED`   | ✅    | Plan implemented and success criteria validated |
| `IMPLEMENTED` | 🔵    | Implementation complete, not yet validated      |
| `IN PROGRESS` | 🟡    | Actively being implemented                      |
| `PLANNED`     | 🟠    | Plan complete, ready for implementation         |
| `PLANNING`    | ⚪    | Plan currently being written                    |
| `STOPPED`     | 🛑    | Plan halted (blocker discovered)                |

## Example Output

```
## Implementation Plans

| #   | Description                                      | Status           | GitRef  | Issue | Staleness        |
|-----|--------------------------------------------------|------------------|---------|-------|------------------|
| 001 | Resolve conflict issues in CRDT merge logic      | ✅ VALIDATED     | abc1234 |       |                  |
| 002 | Add tagging support for notes                    | 🔵 IMPLEMENTED   | def5678 | #45   |                  |
| 003 | Restructure editor for better performance        | 🟡 IN PROGRESS   | ghi9012 |       |                  |
| 004 | Implement responsive mobile layout 📋            | 🟠 PLANNED       | jkl3456 | #52   | ⚠️ 12 behind     |
| 005 | Some older plan without GitRef                   | 🟠 PLANNED       | —       |       |                  |
| 006 | Feature blocked by dependency issue              | 🛑 STOPPED       | mno7890 | #60   |                  |

**Total:** 6 plans — ✅ 1 validated, 🔵 1 implemented, 🟡 1 in progress, 🟠 2 planned, 🛑 1 stopped

---

## Open Issues

| #   | Title                                            | Labels       | Plan |
|-----|--------------------------------------------------|--------------|------|
| #60 | Dependency blocks feature X                      | `bug`        | 006  |
| #52 | Add responsive mobile layout                     | `in-progress`| 004  |
| #50 | Improve startup performance                      |              |      |

**Total:** 3 open issues (2 linked to plans)

---

**Legend:** 📋 = has `_prompt.md` file | ⚠️ = stale plan (run `/update-plan`)
```

## Output Formatting Rules

### Plans Table

**Table Columns:**

1. **#** - Plan number (3 digits)
2. **Description** - Plan description; append 📋 if `_prompt.md` exists
3. **Status** - Emoji followed by status label (e.g., `✅ VALIDATED`, `🟠 PLANNED`)
4. **GitRef** - Short SHA or `—` if missing
5. **Issue** - GitHub issue number (e.g., `#45`) if plan is linked, empty otherwise
6. **Staleness** - Only for PLANNED status: `⚠️ N behind` if commits behind HEAD, empty otherwise

**GitRef & Staleness:**

- Run `git rev-list --count <gitref>..HEAD` only for PLANNED plans (simple command, no cd or error handling)
- Show `⚠️ N behind` only when N > 0
- Non-PLANNED statuses: leave Staleness column empty (staleness irrelevant for completed work)
- Missing GitRef: show `—` in GitRef column

**Issue Linking:**

- Parse plan name for pattern `<issue#>-<description>` (e.g., plan name `45-fix-echo` links to issue #45)
- Show `#<number>` in Issue column if linked
- Empty if no issue linked

**Summary Line:**

- Format: `**Total:** N plans — ✅ X validated, 🔵 Y implemented, 🟡 Z in progress, 🟠 W planned`
- Only include statuses that have counts > 0

### Open Issues Table

**Table Columns:**

1. **#** - Issue number with `#` prefix
2. **Title** - Issue title (truncate to ~45 chars if needed)
3. **Labels** - Comma-separated label names in backticks (e.g., `bug`, `in-progress`), empty if none
4. **Plan** - Plan number (3 digits) if linked, empty otherwise

**Sorting:**

- Sort by issue number descending (newest first)

**Summary Line:**

- Format: `**Total:** N open issues (Z linked to plans)`

### Cross-Referencing Logic

To link a plan to an issue:

1. Extract plan name from filename: `<NNN>_<plan-name>_plan.md` → `<plan-name>`
2. Check if `<plan-name>` starts with digits followed by `-`: regex `^(\d+)-`
3. If match, that digit is the issue number
4. Look up in issues map to verify issue exists
5. Mark both plan and issue as linked

Example: `229_18-admin-fingerprint-fix_plan.md` → Plan 229 links to Issue #18
