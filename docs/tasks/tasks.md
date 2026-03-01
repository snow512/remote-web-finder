# Task Management Rules

This folder manages tasks for the **Remote Web Finder** project.

---

## Folder Structure

```
docs/tasks/
├── tasks.md                  ← This file (rules only)
├── todos.md                  ← Feature improvement TODO list
├── task-{date}-{summary}.md  ← Individual task files
└── .completed/               ← Completed task archive
    └── 2026-01/              ← Monthly subfolders
        └── task-{date}-{summary}.md
```

---

## Status Legend

**Priority:** `🔴 High` `🟡 Medium` `🟢 Low`

---

## Management Rules

1. **New task:** Create `task-{date}-{summary}.md` file
2. **When completed:** Move to `.completed/` folder
3. **Filename format:** `task-{YYYY-MM-DD}-{summary}.md` (e.g., `task-2026-02-28-add-search.md`)
4. **File content:** Include assignee, priority, status, and checklist
5. **Feature improvement tasks:** Select items from [`todos.md`](todos.md); create task file on start and add link to todos.md
6. **After completion:** Check the item as `[x]` in todos.md and move task file to `.completed/`
7. **Phase structure:** Each Phase should have **2-3 items**. Split into multiple Phases if one grows too large

---

## Related Documents

- Feature improvement TODO: [`todos.md`](todos.md)
- Issue management: [`/docs/issues/issues.md`](../issues/issues.md)

---

**Last updated:** 2026-02-28
