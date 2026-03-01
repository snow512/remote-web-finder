# Project Initialization Guide

This file serves as instructions that, when told **"run this file"**, automatically generates the project's docs structure and Claude configuration.

---

## Prerequisites

- Git repository must be initialized
- Node.js project (`package.json` exists)

## Variables

Replace the following values to match your project:

| Variable | Value | Description |
|----------|-------|-------------|
| `{PROJECT_NAME}` | Remote Web Finder | Project display name |
| `{PROJECT_DESC}` | Local markdown document viewer and editor | Project description |

---

## Step 1: Create docs Directory Structure

```bash
mkdir -p docs/specs
mkdir -p docs/tasks/.completed
mkdir -p docs/issues/.resolved

touch docs/specs/.gitkeep
touch docs/tasks/.completed/.gitkeep
touch docs/issues/.resolved/.gitkeep
```

### Files to Create

#### `docs/project.md` — Project Summary

```markdown
# Project Summary

This file manages the project's summary information.
See individual documents in `docs/specs/` for detailed specifications.

---

## Project Overview

- **Name:** {PROJECT_NAME}
- **Description:** {PROJECT_DESC}
- **Type:** (project type)
- **Repository:** (repository URL)

---

## Tech Stack

| Area | Choice | Notes |
|------|--------|-------|
| | | |

---

## How to Run

(Record project-specific run methods, CLI options, port numbers, etc.)

---

## Port Configuration

| Purpose | Port | Notes |
|---------|------|-------|
| | | |

---

## Directory Structure

(Project directory structure)

---

## Current Development Stage

Check files in `docs/tasks/` for currently active work items.
```

#### `docs/specs/specs.md` — Design Document Management Rules

```markdown
# Specs Management Rules

This folder manages design documents for the **{PROJECT_NAME}** project.

---

## Folder Structure

docs/specs/
├── specs.md              ← This file (rules)
├── 1-overview.md         ← Project overview
├── {number}-{topic}.md   ← Individual design documents
└── ...

---

## Management Rules

1. **Filename format:** `{number}-{topic}.md` (e.g., `1-overview.md`, `2-api-design.md`)
2. **Numbering:** Assign sequentially; do not reuse numbers after deletion
3. **Scope:** Requirements, architecture, API design, data models, and other fixed design documents
4. **Modification policy:** Only modify when the design changes; record change history at the bottom
5. **New documents:** Create with the next available number when a new design area is added
6. **Consistency:** Maintain consistency with existing documents; record conflicts in `/docs/decisions.md`

---

## Recommended Document Structure

Each design document should follow this structure:

\```markdown
# {Topic}

## Overview
(Purpose and scope of this document)

## Details
(Design details)

## Change History
| Date | Changes |
|------|---------|
\```

---

## Related Documents

- Architecture decisions: [`/docs/decisions.md`](../decisions.md)
- Task management: [`/docs/tasks/tasks.md`](../tasks/tasks.md)
- Issue management: [`/docs/issues/issues.md`](../issues/issues.md)
```

#### `docs/tasks/tasks.md` — Task Management Rules

```markdown
# Task Management Rules

This folder manages tasks for the **{PROJECT_NAME}** project.

---

## Folder Structure

docs/tasks/
├── tasks.md                  ← This file (rules only)
├── todos.md                  ← Feature improvement TODO list
├── task-{date}-{summary}.md  ← Individual task files
└── .completed/               ← Completed task archive
    └── 2026-01/              ← Monthly subfolders
        └── task-{date}-{summary}.md

---

## Status Legend

**Priority:** `🔴 High` `🟡 Medium` `🟢 Low`

---

## Management Rules

1. **New task:** Create `task-{date}-{summary}.md` file
2. **When completed:** Move to `.completed/` folder
3. **Filename format:** `task-{YYYY-MM-DD}-{summary}.md`
4. **File content:** Include assignee, priority, status, and checklist
5. **Feature improvement tasks:** Select items from `todos.md`; create task file on start and add link to todos.md
6. **After completion:** Check the item as `[x]` in todos.md and move task file to `.completed/`
7. **Phase structure:** Each Phase should have **2-3 items**. Split into multiple Phases if one grows too large

---

## Related Documents

- Feature improvement TODO: [`todos.md`](todos.md)
- Issue management: [`/docs/issues/issues.md`](../issues/issues.md)
```

#### `docs/tasks/todos.md` — TODO List Template

```markdown
# Feature Improvement TODO

Lists improvement items by priority based on currently implemented features.
Create a `task-{YYYY-MM-DD}-{summary}.md` file when starting work.

### Legend
- **Type:** `feature` = complex large feature / `task` = simple single feature
- **Difficulty:** ⬜ Easy (hours) / 🟧 Medium (1-2 days) / 🟥 Hard (3+ days)
- **Priority:** 1 (highest) ~ 5 (later)

---

| # | Priority | Type | Difficulty | Item | Notes |
|---|----------|------|------------|------|-------|
| | | | | | |

---

## Completion History

<details>
<summary>Completed items (click to expand)</summary>

(none)

</details>
```

#### `docs/issues/issues.md` — Issue Management Rules

```markdown
# Issue Management Rules

This folder manages issues (bugs, incidents) for the **{PROJECT_NAME}** project.

---

## Folder Structure

docs/issues/
├── issues.md                     ← This file (rules + index)
├── issue-{date}-{summary}.md    ← Open issues
└── .resolved/                    ← Resolved issue archive
    └── 2026-01/                  ← Monthly subfolders
        └── issue-{date}-{summary}.md

---

## Management Rules

1. **New issue:** Create `issue-{YYYY-MM-DD}-{summary}.md` file
2. **When resolved:** Move to `.resolved/` folder
3. **Filename format:** `issue-{YYYY-MM-DD}-{summary}.md`
4. **File content:** Include date, status, symptoms, cause, and resolution

> See [`/docs/tasks/tasks.md`](../tasks/tasks.md) for task management rules

---

## Open Issues

| Date | Issue | File |
|------|-------|------|
| (none) | | |

---

## Resolved Issues

| Date | Issue | File |
|------|-------|------|
| (none) | | |
```

#### `docs/decisions.md` — Architecture Decisions

```markdown
# Architecture Decisions

Records key technology choices and architectural decisions for the project.

---

## Tech Stack

| Area | Choice | Rationale |
|------|--------|-----------|
| | | |

---

(Add sections to record decisions)
```

---

## Step 2: Create CLAUDE.md

Create `CLAUDE.md` file at the project root.
(Refer to separate template — includes generalized work rules, docs structure, slash command references)

---

## Step 3: .claude Configuration

```bash
mkdir -p .claude
```

#### `.claude/settings.local.json`

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(git reset --hard:*)",
      "Bash(git clean -f:*)",
      "Bash(git checkout -- .:*)",
      "Bash(git branch -D:*)"
    ],
    "allow": [
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "Glob(*)",
      "Grep(*)",
      "Bash(*)",
      "NotebookEdit(*)",
      "WebSearch",
      "WebFetch(*)",
      "Task(*)",
      "TodoWrite(*)",
      "AskUserQuestion(*)",
      "Skill(*)"
    ]
  }
}
```

---

## Step 4: Update .gitignore

Add the following to `.gitignore` if not already present:

```
.claude/
.temp/
```

---

## Verification Checklist

- [ ] `docs/project.md` exists with content
- [ ] `docs/specs/` folder exists
- [ ] `docs/specs/specs.md` exists with content
- [ ] `docs/tasks/tasks.md` exists with content
- [ ] `docs/tasks/todos.md` exists
- [ ] `docs/tasks/.completed/` folder exists
- [ ] `docs/issues/issues.md` exists with content
- [ ] `docs/issues/.resolved/` folder exists
- [ ] `docs/decisions.md` exists
- [ ] `CLAUDE.md` exists
- [ ] `.claude/settings.local.json` exists
- [ ] `.gitignore` includes `.claude/` and `.temp/`
- [ ] No project-specific content (generic template only)
