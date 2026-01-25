---
name: implement-plan
description: Implements a technical plan phase-by-phase, running verification steps after each phase.
---

# Implement Plan

You are tasked with implementing an approved technical plan. Your process must be methodical, phase-driven, and verified at every step.

## Command Format
`/implement-plan <plan-name-or-number>`

## General Process

1.  **Find and Read Plan Files**:
    -   Use the `<plan-name-or-number>` to find all plan files using Glob:
        - `.agent_session/<NNN>_<name>_prompt.md` - Original mission/task
        - `.agent_session/<NNN>_<name>_context.md` - Research findings
        - `.agent_session/<NNN>_<name>_plan.md` - Implementation steps
    -   If plan file not found, inform the user.
    -   Read all three files (if they exist) completely into context.
    -   **Note**: The `_prompt.md` file contains the original user request - keep this in mind throughout implementation to ensure you're achieving the original goal.
    -   **Check Staleness**: Extract the `GitRef` from the plan header. If present, run `git rev-list --count <gitref>..HEAD` to see if the codebase changed. If more than 10 commits behind, warn the user and suggest running `/update-plan <name>` first.
    -   **Update Status**: In the plan file, update the status header from `Status: PLANNED` to `Status: IN PROGRESS`. The header format is:
        ```
        Plan: <NNN> | Name: <plan-name> | Created: YYYY-MM-DD | Status: IN PROGRESS | GitRef: <sha>
        ```
    -   **Update SUMMARY.md**: Find the row for this plan in `.agent_session/SUMMARY.md` and update:
        - Status column: `IN PROGRESS`
        - Last Updated column: current date

2.  **Create Todos**:
    -   Review the entire plan.
    -   Create a `TodoWrite` list that includes each phase of the plan as a distinct item. This gives the user a high-level view of your progress.

3.  **Implement and Verify Phase-by-Phase**:
    -   Starting with the first phase, execute the "Phase Implementation and Verification" loop below.
    -   Do not proceed to the next phase until the current one is fully implemented and verified.

4.  **Run Final Test Suite**:
    -   After all phases are complete, run the full test suite to confirm nothing is broken.
    -   Execute the project's test command (e.g., `npm test`, `pnpm test`, etc.)
    -   If any tests fail, debug and fix the issues before proceeding to the version bump.

5.  **Perform Version Bump**:
    -   After **all** phases are complete and verified, perform the version bump as described in the "Version Management" section.

---

## Phase Implementation and Verification

**Execute this loop for each phase in your Todo list.**

### 1. Focus on the Current Phase
-   Review the plan file again, but focus **only** on the current phase you are implementing. Read its description, required changes, and success criteria. Ignore other phases to keep your context clear.

### 2. Check Platform Implementation Matrix
-   **Before writing code**, check if the plan has a `## Platform Implementation Matrix` section.
-   If present, note which platforms are marked for this phase's changes.
-   **You MUST implement ALL marked areas** - do not skip any marked platform or layer.

### 3. Implement the Code Changes
-   Make the code modifications as described in the current phase of the plan.
-   Follow all project conventions, especially the "Shared First" principle.
-   Add unit tests for any new logic.
-   **If Platform Matrix exists**: Verify you've made changes to ALL marked platforms before proceeding.
-   **If Regression Test specified**: Write the test FIRST (should fail), then implement the fix (test should pass).

### 4. Run Automated Verification
-   After making changes, find the `#### Automated Verification` section within the current phase of the plan.
-   Execute the commands listed there. Prefer combining them into a single command for efficiency (e.g., `pnpm build && pnpm lint && pnpm test`).
-   **If verification fails**: Debug the issue, fix the code, and re-run verification until it passes. Do not proceed until all automated checks are green.

### 5. Update Progress
-   Once verification is successful, update the plan file (`..._plan.md`) by placing an `x` in the checkbox for the completed phase (`- [ ]` -> `- [x]`).
-   Update your `TodoWrite` list, marking the current phase as complete.
-   Briefly inform the user you have completed the phase and are moving to the next one.

---

## Version Management (Semver)

**CRITICAL**: This is the **final step** after all phases are successfully implemented and verified.

### Version Rules
| Change Type | Version Bump | Example | Action |
|---|---|---|---|
| Bug fix / Small feature | PATCH | `0.1.0` → `0.1.1` | Bump automatically |
| API change / Significant feature | MINOR | `0.1.0` → `0.2.0` | Bump automatically |
| Breaking change | MAJOR | `0.1.0` → `1.0.0` | **ASK developer first** |

### Version Bump Procedure
1.  **Determine Bump Type**: Based on the overall plan, choose PATCH, MINOR, or MAJOR.
2.  **Ask for MAJOR**: If it's a MAJOR bump, get user confirmation.
3.  **Execute Bump Command**: Run the project's version bump command (e.g., `npm version <patch|minor|major>`) from the project root.
    -   This command will typically:
        -   Update the `version` in `package.json`.
        -   Create a Git commit and tag for the new version.
4.  **Update Changelog**: Add a one-line entry to the project's CHANGELOG file if one exists.
5.  **Update Plan Status**: In the plan file, update the status header from `Status: IN PROGRESS` to `Status: IMPLEMENTED`. The header format is:
    ```
    Plan: <NNN> | Name: <plan-name> | Created: YYYY-MM-DD | Status: IMPLEMENTED | GitRef: <sha>
    ```
6.  **Update SUMMARY.md**: Find the row for this plan in `.agent_session/SUMMARY.md` and update:
    - Status column: `IMPLEMENTED`
    - Last Updated column: current date
7.  **Add Backlog Items**: If during implementation you discovered:
    - Code that should be refactored
    - Dead code to remove
    - Patterns to unify
    - Technical debt out of scope for this plan

    Add these to `.agent_session/BACKLOG.md` under the appropriate priority section.
    Format: `- [ ] **[Plan <NNN>]** <description>`

---

## If You Get Stuck
If you encounter a problem you can't solve during the implementation or verification of a phase:

1.  **Use Specialized Agents**: Use available specialized agents to debug.
2.  **Present the Issue Clearly**:
    ```
    Implementation problem in Phase [N]:
    - **Error**: [Error message or unexpected behavior]
    - **Files Involved**: [List of relevant files]
    - **What I Tried**: [Steps you took to debug]

    How should I proceed?
    ```

