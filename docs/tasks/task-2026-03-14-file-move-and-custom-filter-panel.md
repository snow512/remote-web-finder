---
title: File Move + Custom Filter Panel
date: 2026-03-14
priority: 2-Medium
status: In Progress
---

## Overview

Two features to add:

1. **File Move** — Add a "Move to..." option in context menu (currently only rename/drag-drop exist)
2. **Custom Filter Panel** — A new sidebar section below the tree that shows filtered views of specific folders

## Custom Filter Panel Details

- User creates a panel by selecting a folder path + file extension filter (e.g., `docs/tasks` + `*.md`)
- Panel shows the matching files from that folder subtree
- Toggle between **tree view** and **flat list view**
- Multiple panels can be created
- Each panel can be deleted
- All panels saved to localStorage (`rwf-custom-filters`)

## Checklist

### Phase 1: File Move
- [x] Add "Move to..." option in context menu
- [x] Show folder picker dialog (airPrompt with folder path input)
- [x] Call existing `/api/rename` endpoint to move
- [x] Update recent files, drafts, current path after move

### Phase 2: Custom Filter Panel UI
- [x] Add "Custom Filters" section in sidebar (below tree)
- [x] Add "+" button to create new filter panel
- [x] Create filter form: folder path input + file extension filter
- [x] Render filtered results from treeData
- [x] Toggle between tree view and flat list view
- [x] Delete button per panel
- [x] localStorage persistence (save/load panels)

### Phase 3: Polish
- [x] Click file in panel → open file (same as tree click)
- [x] Context menu support on panel items
- [x] Style consistency with existing sidebar sections
