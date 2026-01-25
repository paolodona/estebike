---
name: validate-plan
description: Validates that an implementation plan was correctly executed by running all success criteria and generating a verification report.
---

# Validate Plan

You are a quality assurance specialist. Your task is to validate that an implementation plan was correctly executed, verifying all success criteria and identifying any deviations.

## Command Format
`/validate-plan <plan-name-or-number>`

---

## Validation Process

### Step 1: Find and Understand the Plan
1.  **Find Plan Files**: Use the `<plan-name-or-number>` to find all plan files:
    - `.agent_session/<NNN>_<name>_prompt.md` - Original mission/task
    - `.agent_session/<NNN>_<name>_context.md` - Research findings
    - `.agent_session/<NNN>_<name>_plan.md` - Implementation steps
2.  **Read Files**: Read all three files completely to understand:
    - What the user originally asked for (`_prompt.md`)
    - What was researched and decided (`_context.md`)
    - What was supposed to be implemented (`_plan.md`)
3.  **Review Code**: Use `git diff main...HEAD` to review the code that was changed.

### Step 2: Automated Verification
Your most important job is to run the automated checks defined in the plan.

1.  **Locate Checks**: Open the `..._plan.md` file and find the `#### Automated Verification` section.
2.  **Execute Checks**: Run the **exact** commands listed there. Combine them into a single command for efficiency (e.g., `pnpm build && pnpm lint && pnpm test`).
3.  **Analyze Results**: If any command fails, the validation has failed. You must stop and report the failure to the user with the corresponding logs. Do not proceed.

### Step 3: Platform Implementation Matrix Verification

**CRITICAL**: This step catches the "Desktop was never implemented" failure mode.

1.  **Find Platform Matrix**: Look for `## Platform Implementation Matrix` in the plan file.
2.  **Verify ALL Checkmarks**: For each row with checkmarks, verify the corresponding platform/layer has the required change implemented.
3.  **Fail if Incomplete**: If ANY platform is marked but not implemented, **STOP VALIDATION** and report:
    ```
    ❌ VALIDATION FAILED: Platform Implementation Incomplete
    - Component: [name]
    - Missing: [platform/layer]
    - Expected change: [description from plan]
    ```

### Step 4: Assumption Verification

**CRITICAL**: This step catches "assumed cascading fix" failures.

1.  **Find Assumptions**: Look for `## Assumptions Requiring Verification` in the plan file.
2.  **Verify Each Assumption**:
    - For each assumption, execute the verification method
    - If verification method is "unit test", check the test EXISTS and PASSES
    - If verification method is "code trace", perform the trace and document the path
3.  **Fail if Assumption Unverified**: If any assumption cannot be verified, **STOP VALIDATION**:
    ```
    ❌ VALIDATION FAILED: Unverified Assumption
    - Assumption: [description]
    - Verification method: [method]
    - Result: [what you found]
    - Impact: [what this means for the fix]
    ```

### Step 5: Call Graph Verification

**CRITICAL**: This step catches "the fix doesn't reach the bug" failures.

1.  **Find Call Graph**: Look for `## Call Graph Analysis` in the plan file.
2.  **Trace the Path**: Starting from the entry point, trace through each function call to verify the fix actually reaches the bug location.
3.  **Check for Gaps**: Look for intermediate functions that might bypass the fix (like `triggerDebouncedSync → push() → no meta ops`).
4.  **Fail if Path Broken**: If the fix doesn't reach the bug, **STOP VALIDATION**:
    ```
    ❌ VALIDATION FAILED: Call Graph Broken
    - Expected path: [from plan]
    - Actual path: [what you traced]
    - Gap found: [where the fix doesn't reach]
    ```

### Step 5.5: Silent Failure Pattern Check

**CRITICAL**: This step catches "operation silently fails" bugs.

1.  **Find Silent Failure Analysis**: Look for `## Silent Failure Analysis` in the plan file.
2.  **Check Each Pattern**: For each pattern identified:
    - Verify the mitigation was implemented
    - Grep for similar patterns that might have been missed
3.  **Search for Common Patterns**: Run these searches across changed files:
    ```bash
    # Optional chaining on critical operations
    grep -n "?\." [changed files] | grep -v "// ok:"

    # Default values that hide failures
    grep -n "|| ''" [changed files]
    grep -n "?? \[\]" [changed files]
    ```
4.  **Fail if Silent Failures Remain**: If critical operations can fail silently:
    ```
    ❌ VALIDATION FAILED: Silent Failure Pattern
    - Pattern: [e.g., `sync?.queueMetaOp`]
    - Location: [file:line]
    - Impact: [what fails silently]
    - Required: [logging, throwing, or explicit handling]
    ```

### Step 5.6: Edge Case Verification

**CRITICAL**: This step catches race conditions and precondition failures.

1.  **Find Edge Case Analysis**: Look for `## Edge Case & Race Condition Analysis` in the plan file.
2.  **Verify Each Edge Case**: For each precondition/edge case:
    - Check that the "Required Behavior" was implemented
    - Look for tests covering the edge case
3.  **Ask "What If" Questions**:
    - What if the user is offline when this runs?
    - What if WebSocket isn't connected yet?
    - What if the sync adapter is unavailable?
4.  **Fail if Edge Cases Unhandled**: If edge cases cause silent failures or undefined behavior:
    ```
    ❌ VALIDATION FAILED: Unhandled Edge Case
    - Precondition: [e.g., "WebSocket connected"]
    - Edge case: [e.g., "HTTP push before WS connects"]
    - Current behavior: [what actually happens]
    - Required behavior: [from plan]
    ```

### Step 5.7: Critical vs Optional Classification Check

**CRITICAL**: This step catches "optimization" mislabeling.

1.  **Find Classification**: Look for `## Critical vs Optional Classification` in the plan file.
2.  **For Each "OPTIMIZATION" Label**: Ask:
    - What happens if this feature is disabled/broken?
    - Does data loss occur?
    - Do user actions silently fail?
3.  **Fail if Mislabeled**: If an "optimization" is actually critical:
    ```
    ❌ VALIDATION FAILED: Mislabeled Critical Feature
    - Feature: [name]
    - Labeled as: OPTIMIZATION
    - Should be: CRITICAL
    - Reason: [data loss / silent failure / dependency]
    ```

### Step 5.8: Original Mission Verification

**CRITICAL**: This step verifies the implementation achieves what the user originally asked for.

1.  **Read the Prompt File**: Open the `_prompt.md` file and extract:
    - The "Original User Request" section (verbatim user input)
    - The "Refined Prompt" section (if applicable)
2.  **Compare Against Implementation**: Ask:
    - Does the implementation address the core user request?
    - Are there aspects of the original request not addressed by the plan?
    - Did the plan evolve away from the original intent?
3.  **Report Deviations**: If the implementation doesn't match the original mission:
    ```
    ⚠️ MISSION DRIFT DETECTED
    - Original request: "[exact text from _prompt.md]"
    - What was implemented: [summary]
    - Gap: [what's missing or different]
    - Recommendation: [address in follow-up plan / acceptable deviation]
    ```
4.  **Note**: Minor scope refinements are acceptable if documented. Major deviations should be flagged for user review.

### Step 6: Architectural Review (Band-Aid Detection)

Check that the implementation follows architectural best practices and isn't a localized fix that should be centralized.

1.  **Identify the Domain**: Determine which part of the codebase the change is in.

2.  **Check for Duplication**:
    - Search for similar code in other parts of the codebase
    - If logic is duplicated, flag it: "⚠️ Similar logic exists in [location]. Consider unifying."

3.  **Verify Shared-First Principle**:
    - Is business logic in shared modules or duplicated in app-specific code?
    - If duplicated, add to BACKLOG.md: `- [ ] **[Plan <NNN>]** Unify [description] into shared module`

4.  **Cross-Reference Check**:
    - Run: `grep -r "[key function/type name]"` across the codebase
    - Look for parallel implementations that should use the same code path

**If issues found**: Report them but continue validation. Add findings to the "Architectural Notes" section of the validation report.

### Step 7: Documentation Review

Ensure documentation reflects the implementation. Missing documentation leads to stale plans and incorrect future implementations.

1.  **Check Architecture Documentation**: Does it reflect any architectural changes?
    - New modules, new patterns, changed data flows
    - If outdated, UPDATE IT NOW (don't just note it)

2.  **Check Related Documentation**: If domain-specific changes were made:
    - Protocol changes, new APIs, changed handlers
    - If outdated, UPDATE IT NOW

3.  **Check Package/Module Documentation**: If public APIs changed:
    - New exports, changed function signatures, new patterns
    - If outdated, UPDATE IT NOW

4.  **Run documentation gap analysis**:
    - Compare `git diff main...HEAD` against documentation files
    - For each changed file, ask: "Is this change reflected in documentation?"

5.  **Update Front Matter**: After updating any doc file, update its YAML front matter:
    ```yaml
    ---
    GitRef: <current-HEAD-sha>
    LastUpdatedAt: <today-YYYY-MM-DD>
    ---
    ```
    Run `git rev-parse --short HEAD` to get the current commit SHA.
    Use today's date in YYYY-MM-DD format.

    **Note**: If the doc doesn't have front matter yet, add it at the very top of the file, before any existing content.

**CRITICAL**: Do not proceed to Step 8 until documentation is updated. Stale documentation causes future planning errors.

### Step 8: Manual Verification Checklist
Since you cannot see the UI, you must generate a clear, step-by-step checklist for the **user** to perform.

1.  **Locate Criteria**: Find the `#### Manual Verification` section in the plan file.
2.  **Generate Checklist**: Convert these criteria into a clear, imperative checklist in your final report. For example, if the plan says "Desktop app: New functionality appears correctly in the UI", your checklist should say "1. Open the Desktop app and confirm the new functionality appears correctly in the UI."

### Step 9: Generate Validation Report & Update Status

If all verification steps pass:

1.  **Update Plan Status**: In the plan file (`..._plan.md`), update the status header from `Status: IMPLEMENTED` to `Status: VALIDATED`. The header format is:
    ```
    Plan: <NNN> | Name: <plan-name> | Created: YYYY-MM-DD | Status: VALIDATED | GitRef: <sha>
    ```

2.  **Update SUMMARY.md**: Find the row for this plan in `.agent_session/SUMMARY.md` and update:
    - Status column: `VALIDATED`
    - Last Updated column: current date

3.  **Update Context File**: Prepend the following validation report to the top of the context file (`..._context.md`):

```markdown
Status: Verified
ValidatedOn: [YYYY-MM-DD]

---

## Validation Report for Plan <NNN>: <plan-name>

### ✅ Automated Verification: PASSED
- All commands listed in the plan's `Automated Verification` section passed successfully.

### Manual Verification Checklist for User
Please perform the following checks to complete validation:

**Across all affected platforms/apps:**
1. [Test step 1, e.g., "Navigate to the main screen and confirm the new component renders correctly."]
2. [Test step 2, e.g., "Click the 'Save' button and verify the data is persisted."]
3. [Test step 3, e.g., "Go offline, make a change, go back online, and verify the change syncs."]

### Platform Implementation Matrix
- [✅ / ❌] All platforms with checkmarks have been implemented
- [List any missing implementations]

### Assumption Verification
- [✅ / ❌] Assumption: [description] - Verified via [method]
- [List each assumption and its verification result]

### Call Graph Verification
- [✅ / ❌] Fix reaches bug location via: [entry] → [intermediate] → [target]
- [Note any gaps found]

### Silent Failure Analysis
- [✅ / ❌] No critical operations use optional chaining without fallback
- [✅ / ❌] All API calls have error handling
- [List any silent failure patterns found]

### Edge Case Verification
- [✅ / ❌] Behavior specified for offline/disconnected states
- [✅ / ❌] Race conditions handled (e.g., HTTP before WS)
- [List any unhandled edge cases]

### Critical vs Optional Classification
- [✅ / ❌] No critical features mislabeled as "optimization"
- [List any mislabeled features]

### Original Mission Verification
- **Original request**: "[exact text from _prompt.md]"
- [✅ / ⚠️] Implementation addresses the original user request
- [List any gaps or deviations, with justification]

### Architectural Review
- **Domain**: [Client / API / Tooling]
- **Duplication Check**: [✅ No duplication found / ⚠️ Similar code in X - added to BACKLOG]
- **Shared-First**: [✅ Logic in shared modules / ⚠️ Logic duplicated - added to BACKLOG]

### Documentation Updates
- [✅ / ⚠️] Architecture documentation - [Updated / No changes needed / N/A]
- [✅ / ⚠️] API/Protocol documentation - [Updated / No changes needed / N/A]
- [✅ / ⚠️] Module documentation - [Updated / No changes needed / N/A]

### Implementation Notes
- **Deviations**: [Note any discovered deviations from the plan]
- **Potential Issues**: [Note any potential issues found]
- **Backlog Items Added**: [List any items added to BACKLOG.md, or "None"]

---
```

### Step 10: Final Output

After successfully updating the context file, present the following to the user:
```
Plan `<plan-name>` has passed all automated verification steps.

The validation report and a manual verification checklist have been added to:
`.agent_session/<NNN>_<plan-name>_context.md`

Please perform the manual checks. Once complete, you can commit the documentation and validation artifacts using:

`git commit -m "docs: Validate plan <NNN> (<plan-name>)"`
```

---

## IMPORTANT: No Version Bumping

**Validation does NOT warrant a version bump.** Version changes (MAJOR, MINOR, PATCH) reflect actual code changes:
- **PATCH** - Bug fixes (implementation)
- **MINOR** - New features (implementation)
- **MAJOR** - Breaking changes (implementation)

Validation is verification only—no new features, no bug fixes, no code changes. The version bump happened when the plan was **implemented**, not when it was validated.

**Do NOT:**
- Update `package.json` version
- Add entries to `CHANGELOG.md`
- Bump any version numbers

