# Madang Quick Guide

Madang is a markdown-based project management tool.
Initialize with the CLI, manage with the web dashboard, and write documents with AI (Claude).

---

## Installation

```bash
npm install -g madang-ai
```

---

## Quick Start

```bash
# 1. Navigate to project folder
cd my-project

# 2. Initialize Madang (all categories)
madang init -a

# 3. Start web dashboard
madang serve

# Open http://localhost:7001 in browser
```

---

## CLI Commands

### `madang init` — Initialize Project

Select only the categories you need.

```bash
madang init -a              # All categories
madang init -t              # Tickets (groups/features/tasks)
madang init -i              # Issue tracking
madang init -s              # Technical specs
madang init -r              # Requirements
madang init -u              # UI design
madang init -d              # Decision records (ADR)
madang init -c              # Code conventions
madang init -w              # Workspaces (multi-clone management)
madang init -tis            # Can be combined
madang init -a -f           # Force re-initialize
```

After initialization, `.madang/` (rules) and `docs/` (documents) folders are created.

### `madang serve` — Start Web Dashboard

```bash
madang serve                # Foreground (default port 7001)
madang serve -p 8080        # Custom port
madang serve -b             # Background mode
```

### `madang stop` — Stop Background Server

```bash
madang stop
```

### `madang status` — Project Status Summary

```bash
madang status               # Category-level document count and status summary
madang status --json        # JSON output
```

### `madang export` / `madang import` — Export/Import

```bash
madang export               # Export .madang/ folder only
madang export --docs        # Include docs/
madang import backup.tar.gz # Restore from archive
madang import backup.tar.gz -f  # Overwrite existing files
```

---

## Quick Reference

| Item | Path |
|------|------|
| Project summary | `docs/project.md` |
| Central rules | `.madang/madang.md` |
| Category governance | `.madang/categories/<category>/*.md` |
| Project documents | `docs/<category>/` |
| Active categories | `.madang/config.json` |

---

## Folder Structure

Structure created after initialization:

```
my-project/
├── .madang/                # Governance rules
│   ├── madang.md           # Central rules
│   ├── config.json         # Active categories
│   └── categories/         # Per-category rules
│       ├── tickets/        # Ticket rules (groups, features, tasks)
│       ├── issues/         # Issue rules
│       ├── specs/          # Spec rules
│       ├── requirements/   # Requirement rules
│       ├── uis/            # UI design rules
│       ├── decisions/      # Decision record rules
│       ├── conventions/    # Code convention rules
│       └── workspaces/     # Workspace management rules
├── docs/                   # Project documents
│   ├── project.md          # Project summary
│   ├── groups/             # Kanban stages
│   ├── features/           # Features
│   ├── tasks/              # Tasks
│   ├── issues/             # Issues
│   ├── specs/              # Technical specs
│   ├── requirements/       # Requirements
│   ├── decisions/          # Decision records
│   ├── ui/                 # UI design
│   ├── conventions/        # Code conventions
│   └── workspaces/         # Workspace progress
└── CLAUDE.md               # Claude AI entrypoint
```

---

## Web Dashboard Features

Available in browser after running `madang serve`:

| Page | Description |
|------|-------------|
| Dashboard | Project-wide status at a glance |
| Kanban Board | Manage features by group with drag & drop |
| Features | View/create/edit features |
| Tasks | View/create/edit tasks |
| Issues | Bug/incident tracking |
| Specs | Technical reference documents |
| Requirements | Functional/non-functional requirements |
| Decisions | Architecture decision records (ADR) |
| UI Design | Wireframes, styles, components |
| Code Conventions | Coding style, naming rules, Git rules |
| Workspaces | Multi-clone progress, port scheme, environment separation |

---

## Using with Claude

Madang integrates with Claude AI through `CLAUDE.md`.
Running `madang init` installs skill files in `.claude/skills/`, enabling natural language project management in Claude Code.

```bash
# Use directly in Claude Code after initialization
claude

# Example commands for Claude:
# "initialize madang project" — fill project.md placeholders through conversation
# "record task" — record current work as a task
# "create issue" — create a new issue
# "check progress" — check current progress
# "commit and push" — commit + push + auto-update tasks
```

---

## Claude Skill Guide

Skills automatically installed by `madang init`.
Use via slash commands (`/madang-...`) or natural language in Claude Code.

### Base Skills (always installed)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-init-project` | "initialize madang project" | Fill `docs/project.md` placeholders through conversation and set language preferences |
| `madang-status` | "check progress" | Summary of document counts and progress by active category |
| `madang-search` | "search documents" | Keyword search across all markdown files in `docs/` |
| `madang-daily-summary` | "summarize today" | Changed documents, in-progress tasks, unresolved issues |
| `madang-cleanup` | "clean up documents" | Check for orphan features, stale tasks, status mismatches |
| `madang-archive` | "archive" | Move completed documents to per-category archive folders |
| `madang-reinforce` | "reinforce" | Find and fix issues in existing implementation, verify with tests |
| `madang-improve` | "improve" | Report improvement plans first, execute only approved items |
| `madang-commit` | "commit" | Commit changes only (no push) |
| `madang-commit-push` | "commit and push" | Commit + push + auto-update related tasks |
| `madang-commit-push-only` | "commit and push only" | Commit + push only (no task updates) |
| `madang-record-directive` | "record directive" | Add new directive to CLAUDE.md management directives section |

### Ticket Skills (`-t`)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-new-feature` | "create feature" | Ask for title/description/priority and create in `docs/features/`, register in Plan group |
| `madang-new-task` | "record task" | Ask for title/description/parent feature and create in `docs/tasks/` |
| `madang-move-feature` | "move feature" | Move feature to another kanban group (Plan→ToDo→Doing→Done) |
| `madang-complete-task` | "complete task" | Mark task as Done and move to `docs/tasks/.completed/` |
| `madang-board` | "show kanban board" | Output all groups and features as text kanban board |

### Issue Skills (`-i`)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-new-issue` | "create issue" | Ask for symptoms/severity and create issue file in `docs/issues/` |
| `madang-resolve-issue` | "resolve issue" | Record cause/solution and move to `docs/issues/.resolved/` |
| `madang-list-issues` | "list issues" | Output unresolved issues sorted by severity |

### Spec Skills (`-s`)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-new-spec` | "create spec" | Ask for topic/overview and create technical reference in `docs/specs/` (auto-detects codebase) |

### Requirement Skills (`-r`)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-new-requirement` | "create requirement" | Ask for description/category (Functional/Non-Functional/Constraint)/acceptance criteria |

### UI Skills (`-u`)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-new-wireframe` | "create wireframe" | Write page layout as ASCII wireframe in `docs/ui/wireframes/` |
| `madang-new-component` | "create component spec" | Define component variants/states/props in `docs/ui/components/` |
| `madang-new-style` | "create style guide" | Define color/typography/spacing design tokens in `docs/ui/styles/` |

### Decision Skills (`-d`)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-new-decision` | "record decision" | Document context/options/rationale as ADR in `docs/decisions/` |
| `madang-supersede-decision` | "supersede decision" | Move existing ADR to `.superseded/` and create new decision |

### Convention Skills (`-c`)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-new-convention` | "create convention" | Define scope (project/frontend/backend)/rules/exceptions in `docs/conventions/` |
| `madang-check-convention` | "check conventions" | Compare code against defined conventions, report violations |
| `madang-list-conventions` | "list conventions" | Output all conventions grouped by scope |

### Workspace Skills (`-w`)

| Skill | Trigger Example | Description |
|-------|-----------------|-------------|
| `madang-new-workspace` | "register workspace" | Ask for clone directory/port assignment/environment and register in `docs/workspaces/` |
| `madang-workspace-status` | "show workspace status" | Summary of all workspaces' in-progress work, branches, ports |
| `madang-update-progress` | "record progress" | Update current workspace's progress file (work/branch/stage) |
| `madang-archive-progress` | "archive progress" | Move completed progress items to `docs/workspaces/.archive/` |

---

## FAQ

**Q: Can I add categories to an already initialized project?**
A: Yes. Just specify the categories to add, e.g. `madang init -i`. Existing files won't be overwritten.

**Q: How to change the port?**
A: Use `madang serve -p 8080` to specify your desired port.

**Q: How to run in background?**
A: Run `madang serve -b` and stop with `madang stop`.

**Q: How to transfer settings to another project?**
A: Export with `madang export` and import in the target project with `madang import`.
