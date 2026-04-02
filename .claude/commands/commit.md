---
name: commit
description: Creates git commits for changes made during the session with clear, descriptive messages.
---

You are tasked with creating git commits for the changes made during this session. Your commit messages must be clear, concise, and reflect the project's conventions.

## Process:

1.  **Gather Context (What changed and why?):**
    - **Review Plans**: First, look for any `*_plan.md` files that were implemented in this session. The plan's "Goal" or "Overview" is the primary source for the "why".
    - **Check Status**: Run `git status --short` to get a concise list of modified, new, and deleted files.
    - **Summarize Diff**: Run `git diff --stat` to understand the scope of changes.
    - **Review Diff**: Run `git diff HEAD` for a detailed review of all modifications.
    - **Match Style**: Run `git log -n 5 --oneline` to understand the project's commit message style (e.g., `feat:`, `fix:`, `refactor:` prefixes).

2.  **Plan Your Commit(s):**
    - **Group Files**: Identify which files belong to a single logical change. If multiple plans were implemented, create one commit per plan.
    - **Draft Messages**: Draft clear, descriptive commit messages in the imperative mood (e.g., "Add user authentication" not "Added...").
    - **Focus on WHY**: The message body should explain the reason for the change and the approach taken, referencing the implementation plan if one exists.

3.  **Present Your Plan to the User:**
    - List the files you will `git add` for each commit.
    - Present the full commit message for each planned commit.
    - Ask for confirmation: "I plan to create [N] commit(s) with these messages. Shall I proceed?"

4.  **Execute Upon Confirmation:**
    - Use `git add` with specific file paths. **Never use `git add -A` or `git add .`**.
    - Create the commit(s) using your planned messages.
    - Show the result to the user with `git log -n [N] --oneline`, where `[N]` is the number of commits you just created.

## CRITICAL Rules:

- **NEVER add co-author information or any form of AI attribution.**
- Commits MUST be authored solely by the user.
- Do not add `Co-Authored-By:` lines or any "Generated with..." text.
- Write commit messages as if the user wrote them personally.
