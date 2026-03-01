# Specs Management Rules

This folder manages design documents for the **Remote Web Finder** project.

---

## Folder Structure

```
docs/specs/
├── specs.md              ← This file (rules)
├── 1-overview.md         ← Project overview
├── {number}-{topic}.md   ← Individual design documents
└── ...
```

---

## Management Rules

1. **Filename format:** `{number}-{topic}.md` (e.g., `1-overview.md`, `2-api-design.md`)
2. **Numbering:** Assign sequentially; do not reuse numbers after deletion
3. **Scope:** Requirements, architecture, API design, data models, and other fixed design documents
4. **Modification policy:** Only modify when the design changes; record change history at the bottom of the document
5. **New documents:** Create with the next available number when a new design area is added
6. **Consistency:** Maintain consistency with existing design documents; record conflicts in `/docs/decisions.md`

---

## Recommended Document Structure

Each design document should follow this structure:

```markdown
# {Topic}

## Overview
(Purpose and scope of this document)

## Details
(Design details)

## Change History
| Date | Changes |
|------|---------|
```

---

## Related Documents

- Architecture decisions: [`/docs/decisions.md`](../decisions.md)
- Task management: [`/docs/tasks/tasks.md`](../tasks/tasks.md)
- Issue management: [`/docs/issues/issues.md`](../issues/issues.md)
