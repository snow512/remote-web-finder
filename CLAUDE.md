# Claude Task Management

This file is the central management document for project workflow efficiency.
It organizes key information so Claude can quickly understand the project context and work efficiently.

---

## Language Preferences

| Context | Language | Notes |
|---------|----------|-------|
| Source code (comments, variables) | English | All code comments and identifiers in English |
| Documentation (docs/, README, etc.) | English | All project documents in English |
| Commit messages | Korean | Git commit messages in Korean |
| Claude conversation | Korean | Respond to user in Korean |

---

## Project Summary
Refer to `docs/project.md`.

---

## Documentation Structure & Management Rules

All documents are managed under the `/docs` folder.
Each folder has a file with the same name as the folder to manage its rules.

```
docs/
├── project.md               # Project summary (run methods, ports, tech stack, etc.)
├── specs/                   # Design documents (detailed)
│   ├── tasks.md             # Task management rules
│   ├── todos.md             # Feature improvement TODO list
│   ├── task-{YYYY-MM-DD}-{summary}.md  # Individual tasks
│   └── .completed/          # Completed task archive
├── issues/                  # Issue tracking
│   ├── issues.md            # Issue management rules
│   ├── issue-{YYYY-MM-DD}-{summary}.md
│   └── .resolved/           # Resolved issue archive
└── decisions.md             # Architecture decisions
```

### `/docs/specs` - Design Documents
**Purpose:** Fixed development documents including requirements, architecture, and design

**Management Rules:**
- Filename: `{number}-{topic}.md` (e.g., `1-overview.md`)
- Content: Project design, requirements, API design, and other reference materials
- Modification: Only when design changes (record change history)

### `/docs/issues` - Issue Tracking
**Purpose:** Record discovered bugs, improvements, and problems

**Management Rules:**
- Filename: `issue-{YYYY-MM-DD}-{summary}.md`
- **Resolved issues:** Move to `/docs/issues/.resolved/` folder
- **Open issues:** Keep in `/docs/issues/` root

### `/docs/decisions.md` - Decisions
**Purpose:** Record key technology choices and architecture decisions

**Management Rules:**
- Keep only confirmed, must-remember decisions
- Manage as a single file without unnecessary history or status divisions
- Add new decisions to the appropriate section

### `/docs/tasks/` - Task Management
**Purpose:** Manage upcoming work items

**Management Rules:**
- Manage individually as `task-{YYYY-MM-DD}-{summary}.md` files
- On completion: Move to `.completed/` folder
- Priority: `🔴 High` `🟡 Medium` `🟢 Low`

---

## Rules

### Custom Slash Commands / Skills
- **`/commit-push`** — Commit and push current changes. Includes automatic task updates.
- **`/merge-develop`** — Merge current branch into develop and delete the branch.

### Management Directives (Abracadabra)
Directives to execute when the user gives direct commands.
- **"지침에 기록해"** = Record in the management directives section of this file (`CLAUDE.md`).
- **"진행사항 파악해"** = Read commit history, find related tasks in `docs/tasks`, and assess current progress.
- **"타스크 기록해"** = Update the related task in `docs/tasks/` for current work, or create a new one if none exists.
- **"타스크 완료해"** = Update the related task in `docs/tasks/` for current work and mark it complete.
- **"보강해"** = Reinforce or fix issues in existing implementation. Complete testing to verify proper operation.
- **"개선해"** = Extend existing implementation for better usability or fix UX-level issues. Must report improvement plans to user first and only perform approved improvements.
- **"커밋해"** = Commit current work only, do not push.
- **"커밋 푸쉬해"** or **"커푸"** = Run `/commit-push` skill.
- **"커밋 푸쉬만해"** = Commit and push current work only. (No task updates)
- **"프로젝트 초기화해"** = Follow `project-init.md` to set up project initialization. (Create docs structure, CLAUDE.md, .claude settings, update .gitignore, etc.)

### Management Rules
General rules to follow.
- **Update docs before and after work:** When the user assigns work, ① update related tasks (`docs/tasks/`) before starting, and ② reflect progress in related tasks after completion.
- **Temp file management:** Debug screenshots, logs, and temp files must be saved in `.temp/` folder. Never create them directly in the project root or source directories. (`.temp/` is included in `.gitignore`)
- **When planning work:** Always create `/docs/tasks/task-{YYYY-MM-DD}-{summary}.md` or update existing tasks based on plans from plan mode. Do not implement without writing a task document first.
- **Do not move tasks to `.completed/` until the user confirms completion.** Even if work is done, only archive after explicit user confirmation.

---

## Workflow Steps

### 1. Project Assessment
- Read this file (`CLAUDE.md`) first
- Check current active tasks in `/docs/tasks/`
- Reference related design documents in `/docs/specs/` as needed

### 2. Design Phase
- Design first, then implement.
- Maintain consistency with existing designs (`/docs/specs/`)
- Add new decisions to the appropriate section in `/docs/decisions.md`

### 3. Task Writing Phase
- Always create or update a task in `docs/tasks/` before starting work.
- Structure tasks by Phase and execute step by step.
- Each phase should have 3 or fewer items or less than 1 hour of work. Ask the user if uncertain.

### 4. Execution Phase
- Record problems in `/docs/issues/`
- Minimize user intervention. Questions requiring user input should be asked during the design phase.

### 5. Documentation
Update documentation before work when possible. Also update after work is complete.
- **New task:** Create `/docs/tasks/task-{YYYY-MM-DD}-{summary}.md`
- **Task complete:** Move to `/docs/tasks/.completed/`, only after user confirmation.
- **Design change:** Modify the relevant file in `/docs/specs/`
- **Technical decision:** Add to the appropriate section in `/docs/decisions.md`
- **Bug/Issue:** Create `issue-{date}-{summary}.md` in `/docs/issues/`

---

## Quick Reference

### Run Commands
```bash
# Start server
npm start

# Run tests
npm test
```

### Directory Navigation
```
remote-web-finder/
├── server.js             → Express server main file
├── server.test.js        → Test file
├── public/               → Static files (client)
├── docs/                 → All documentation
│   ├── project.md        → Project summary
│   ├── specs/            → Design documents (detailed)
│   ├── issues/           → Issue tracking
│   ├── tasks/            → Task management
│   └── decisions.md      → Architecture decisions
├── CLAUDE.md             → This file (entrypoint)
└── project-init.md       → Project initialization guide
```

---

## Quick Links

- **Project summary:** `/docs/project.md`
- **Design documents:** `/docs/specs/`
- **Task management:** `/docs/tasks/`
- **Issue tracking:** `/docs/issues/`
- **Architecture decisions:** `/docs/decisions.md`

---

## History Reference

History can be found in the documents below. Do not record directly in this file.

- **Work history:** `git log --oneline` or `/docs/tasks/`
- **Technical decisions:** `/docs/decisions.md`

---

## Entrypoint

This file (**CLAUDE.md**) is the project's **sole entrypoint**.
- All project information is managed here or in the `/docs/` folder.
- Each file is regularly updated to reflect the latest project status.
