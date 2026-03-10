# Claude Task Management

This file is the central management document for project workflow efficiency.
It organizes key information so Claude can quickly understand the project context and work efficiently.

---

## Language Preferences

| Context | Language | Notes |
|---------|----------|-------|
| Source code (comments, variables) | English | All code comments and identifiers in English |
| Documentation (docs/, README, etc.) | English | All project documents in English |
| Commit messages | English | Git commit messages in English |
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


<!-- madang-base -->
프로젝트 요약 정보는 `docs/project.md`에 있으며, 프로젝트 맥락이 필요할 때 항상 먼저 읽으세요. 프로젝트 관리에 관한 모든 규칙과 폴더 구조는 `.madang/madang.md`를 참조하세요. 마당 사용 가이드는 `docs/user-manual.md`를 참조하세요. 활성 카테고리와 언어 선호는 `.madang/config.json`에서 확인하세요. `docs/` 문서를 생성하거나 수정하기 전에, 해당 카테고리의 거버넌스 파일(`.madang/categories/<카테고리>/`)을 먼저 읽고 규칙을 따르세요.

**중요: 마당 시스템 관련 내용(워크플로우, 문서 규칙, 추적 정책 등)은 CLAUDE.md에 직접 작성하지 않는다.** 반드시 마당 시스템 내의 해당 위치(가이드, 스킬, 스니펫)에서 수정하고, `madang init` 또는 소스 역동기화를 통해 반영한다. CLAUDE.md의 `프로젝트 고유 규칙` 섹션에는 마당 시스템과 무관한 프로젝트 고유 설정만 기록한다.
<!-- /madang-base -->


<!-- madang-ticket -->
티켓 관리 규칙은 `.madang/categories/tickets/`에 정의되어 있습니다 (groups.md, features.md, tasks.md). 문서는 `docs/groups/`, `docs/features/`, `docs/tasks/`에 저장됩니다.

### 워크플로우
- **계획모드 우선**: 큰 작업은 피쳐/타스크 문서를 먼저 생성한 뒤 구현을 시작한다.
- **Doing은 동시 3개 이하** (WIP 제한). Done 이동은 사용자 확인 후에만.

### 작성 기준
- 피쳐 = 하나의 사용자 가치. 타스크 = 하루 이내 완료 가능한 단위.
- 파일명: `feature-{YYYY-MM-DD}-{slug}.md`, `task-{YYYY-MM-DD}-{slug}.md`

### 타스크 자동 추적
개발 작업을 진행할 때 관련 타스크/피쳐 문서를 자동으로 업데이트한다:
- **작업 시작 시**: 관련 타스크의 status를 `In Progress`로 변경한다.
- **작업 완료 시**: 타스크의 status를 `Done`으로 변경하고, 체크리스트 항목을 `[x]`로 체크한다.
- **피쳐 상태 연동**: 피쳐의 모든 하위 타스크가 Done이면 피쳐도 `Done`으로, 하나라도 In Progress면 `In Progress`로 변경한다. 피쳐의 하위 타스크 테이블도 함께 업데이트한다.
- **매칭 방법**: 현재 작업 내용과 `docs/tasks/`의 타스크 제목/체크리스트를 매칭한다. 매칭되는 타스크가 없으면 추적하지 않는다.

> 피쳐/타스크를 새로 생성하거나, 칸반 그룹을 이동하거나, 계획모드로 작업을 설계할 때는 `.madang/categories/tickets/ticket-guide.md`를 먼저 읽으세요.
<!-- /madang-ticket -->


<!-- madang-issue -->
이슈 추적 규칙은 `.madang/categories/issues/issues.md`에 정의되어 있습니다. 이슈 문서는 `docs/issues/`에 저장됩니다.

**심각도 기준:** Critical(서비스 중단) → High(핵심 기능 장애) → Medium(워크어라운드 있음) → Low(사소한 불편)

이슈 작성 시 재현 절차를 반드시 포함하고, 해결 시 원인과 해결 방법 섹션을 채운 뒤 `.resolved/`로 이동한다.

> 이슈를 새로 등록하거나 해결 처리할 때는 `.madang/categories/issues/issue-guide.md`를 먼저 읽으세요.
<!-- /madang-issue -->


<!-- madang-spec -->
스펙(기술 참조) 규칙은 `.madang/categories/specs/specs.md`에 정의되어 있습니다. 스펙 문서는 `docs/specs/`에 저장됩니다.

스펙은 코드가 아닌 설계 의도와 제약을 기록하는 살아있는 문서입니다. 하나의 스펙 = 하나의 주제. 코드가 변경되면 관련 스펙도 함께 업데이트하세요. 파일명에 날짜 접두사는 불필요합니다.

> 스펙을 새로 작성하거나, 코드 변경으로 기존 스펙을 업데이트할 때는 `.madang/categories/specs/spec-guide.md`를 먼저 읽으세요.
<!-- /madang-spec -->


<!-- madang-requirement -->
요구사항 관리 규칙은 `.madang/categories/requirements/requirements.md`에 정의되어 있습니다. 요구사항 문서는 `docs/requirements/`에 저장됩니다.

요구사항은 구현 방법이 아닌 "무엇"을 기술합니다. 검증 가능한 인수 조건을 반드시 포함하세요. 카테고리: Functional(기능) / Non-Functional(품질 속성) / Constraint(제약).

> 요구사항을 새로 작성하거나 우선순위·상태를 변경할 때는 `.madang/categories/requirements/requirement-guide.md`를 먼저 읽으세요.
<!-- /madang-requirement -->


<!-- madang-ui -->
UI 디자인 규칙은 `.madang/categories/uis/ui.md`에 정의되어 있습니다. UI 문서는 `docs/ui/`(wireframes, styles, components)에 저장됩니다.

### 필수 원칙
1. **공통 컴포넌트 우선** — 페이지를 만들기 전에 `docs/ui/components/`에서 재사용 가능한 컴포넌트를 먼저 확인한다.
2. **디자인 토큰 사용** — 색상, 간격, 폰트 크기에 매직넘버를 쓰지 않는다. 의미 기반 변수명(`--color-primary`, `--spacing-md`)을 사용한다.
3. **비슷한 UI가 2번 이상 나타나면 컴포넌트로 추출**한다.

> UI 컴포넌트를 설계하거나, 와이어프레임을 작성하거나, 스타일 토큰을 정의할 때는 `.madang/categories/uis/ui-guide.md`를 먼저 읽으세요.
<!-- /madang-ui -->


<!-- madang-decision -->
결정 기록(ADR) 규칙은 `.madang/categories/decisions/decisions.md`에 정의되어 있습니다. 결정 문서는 `docs/decisions/`에 저장됩니다.

결정은 발생 시점에 바로 기록하며, 최소 2개 이상의 선택지를 검토하여 장단점을 균형 있게 작성합니다. 수락된 결정은 수정하지 않습니다 — 변경이 필요하면 새 ADR로 대체(Supersede)합니다.

> 기술 스택 선택, 아키텍처 변경, 트레이드오프가 있는 의사결정 시 `.madang/categories/decisions/decision-guide.md`를 먼저 읽으세요.
<!-- /madang-decision -->


<!-- madang-convention -->
코드 컨벤션 규칙은 `.madang/categories/conventions/conventions.md`에 정의되어 있습니다. 컨벤션 문서는 `docs/conventions/`에 저장됩니다.

**코드를 작성하거나 수정할 때 반드시 `docs/conventions/`의 컨벤션 문서를 확인하고 따르세요.** 컨벤션 작성 시 좋은 예와 나쁜 예를 반드시 포함하고, 강제 규칙과 권장 규칙을 구분하세요. 자동화 가능한 규칙은 린터/포매터로 강제합니다.

> 새 컨벤션을 정의하거나 기존 컨벤션을 변경·폐기할 때는 `.madang/categories/conventions/convention-guide.md`를 먼저 읽으세요.
<!-- /madang-convention -->


<!-- madang-workspace -->
워크스페이스(멀티 클론) 관리 규칙은 `.madang/categories/workspaces/workspaces.md`에 정의되어 있습니다. 워크스페이스 문서는 `docs/workspaces/`에 저장됩니다.

**가장 중요한 규칙: 자기 워크스페이스 파일만 수정한다.** 다른 워크스페이스 파일은 읽기 전용으로 참고. 같은 feature 브랜치를 여러 워크스페이스에서 동시에 작업하지 않는다. 진행 파일은 작업 시작/완료, 브랜치 변경, 하루 종료 시 업데이트한다.

> 워크스페이스를 새로 등록하거나, 포트 설정·동기화·머지 시 충돌이 발생하면 `.madang/categories/workspaces/workspace-guide.md`를 먼저 읽으세요.
<!-- /madang-workspace -->
