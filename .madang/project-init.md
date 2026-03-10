# 프로젝트 초기화 가이드

`madang init` CLI 명령이 수행하는 작업을 문서화합니다.

---

## 카테고리 기반 초기화

마당은 8개의 독립 카테고리를 사용합니다. 초기화할 카테고리를 선택하세요:

```bash
madang init                      # 도움말 표시 (카테고리 미선택)
madang init -t                   # 티켓 관리만
madang init -i                   # 이슈 추적만
madang init -tir                 # 카테고리 조합
madang init -a                   # 전체 카테고리
madang init -a -f                # 전체 재초기화
```

| 플래그 | 카테고리 | 설명 |
|--------|----------|------|
| `-t, --ticket` | 티켓 | 그룹, 피쳐, 타스크 |
| `-i, --issue` | 이슈 | 버그/장애 추적 |
| `-s, --spec` | 스펙 | 기술 참조 문서 |
| `-r, --requirement` | 요구사항 | 요구사항 수집 |
| `-u, --ui` | UI | 와이어프레임, 스타일, 컴포넌트 |
| `-d, --decision` | 결정 | 결정 기록 (ADR) |
| `-c, --convention` | 컨벤션 | 코드 컨벤션 (코딩 스타일, 명명, Git) |
| `-w, --workspace` | 워크스페이스 | 멀티 클론 관리 (진행 현황, 포트, 환경 분리) |
| `-a, --all` | (전체) | 모든 카테고리 초기화 |

---

## 초기화 확인

CLI는 대상 디렉토리에 `.madang/` 폴더가 있는지 확인합니다.
- 존재하는 경우: **추가 모드로 진행** — 기존 카테고리에 새 카테고리를 추가
  - 각 파일/디렉토리 핸들러는 파일별 건너뛰기 로직(`opts.force || !fs.existsSync(dest)`)을 사용하므로, 기존 파일은 절대 덮어쓰지 않음
  - 안내 메시지 표시: *"기존 프로젝트에 카테고리를 추가합니다 (--force로 덮어쓰기 가능)."*
- `--force` (`-f`)를 사용하면 강제 재초기화 (모든 파일 덮어쓰기)

---

## `madang init` 수행 내용

### 공통 (항상 실행)

1. `.madang/` 폴더 생성
2. `madang.md`, `project-init.md`, `madang-snippet.md`, `user-manual.md`를 `.madang/`에 복사
3. `docs/` 디렉토리 생성
4. `docs/project.md` 생성 — 플레이스홀더 템플릿 (`(placeholder)`로 표시된 필드)
5. `docs/user-manual.md` 생성 — 마당 사용 가이드 (user-manual.md 복사)

### 카테고리: 티켓 (`-t`)

1. `.madang/categories/tickets/` 폴더 복사 (`groups.md`, `features.md`, `tasks.md`, `ticket-guide.md`, `ticket-snippet.md`)
2. 디렉토리 생성:
   ```
   docs/groups/
   docs/features/.archive/
   docs/tasks/.completed/
   ```
3. 기본 그룹 파일 생성 (Plan, ToDo, Doing, Done)
4. `ticket-snippet.md` 내용을 CLAUDE.md에 추가

### 카테고리: 이슈 (`-i`)

1. `.madang/categories/issues/` 폴더 복사 (`issues.md`, `issue-guide.md`, `issue-snippet.md`)
2. 디렉토리 생성:
   ```
   docs/issues/.resolved/
   ```
3. `issue-snippet.md` 내용을 CLAUDE.md에 추가

### 카테고리: 스펙 (`-s`)

1. `.madang/categories/specs/` 폴더 복사 (`specs.md`, `spec-guide.md`, `spec-snippet.md`)
2. 디렉토리 생성:
   ```
   docs/specs/
   ```
3. `spec-snippet.md` 내용을 CLAUDE.md에 추가

### 카테고리: 요구사항 (`-r`)

1. `.madang/categories/requirements/` 폴더 복사 (`requirements.md`, `requirement-guide.md`, `requirement-snippet.md`)
2. 디렉토리 생성:
   ```
   docs/requirements/.archive/
   ```
3. `requirement-snippet.md` 내용을 CLAUDE.md에 추가

### 카테고리: UI (`-u`)

1. `.madang/categories/uis/` 폴더 복사 (`ui.md`, `ui-guide.md`, `ui-snippet.md`)
2. 디렉토리 생성:
   ```
   docs/ui/wireframes/
   docs/ui/styles/
   docs/ui/components/
   ```
3. `ui-snippet.md` 내용을 CLAUDE.md에 추가

### 카테고리: 결정 (`-d`)

1. `.madang/categories/decisions/` 폴더 복사 (`decisions.md`, `decision-guide.md`, `decision-snippet.md`)
2. 디렉토리 생성:
   ```
   docs/decisions/.superseded/
   ```
3. `decision-snippet.md` 내용을 CLAUDE.md에 추가

### 카테고리: 컨벤션 (`-c`)

1. `.madang/categories/conventions/` 폴더 복사 (`conventions.md`, `convention-guide.md`, `convention-snippet.md`)
2. 디렉토리 생성:
   ```
   docs/conventions/.deprecated/
   ```
3. `convention-snippet.md` 내용을 CLAUDE.md에 추가

### 카테고리: 워크스페이스 (`-w`)

1. `.madang/categories/workspaces/` 폴더 복사 (`workspaces.md`, `workspace-guide.md`, `workspace-snippet.md`)
2. 디렉토리 생성:
   ```
   docs/workspaces/.archive/
   ```
3. `workspace-snippet.md` 내용을 CLAUDE.md에 추가

---

## Claude 스킬 복사

각 카테고리의 `skills/` 하위 폴더에 있는 스킬 파일(`.md`)을 프로젝트의 `.claude/skills/`로 복사합니다.
스킬 파일명은 `madang-` 접두사로 이름 충돌을 방지합니다.

### 충돌 처리

- `.claude/skills/`에 동일한 이름의 파일이 이미 존재하면 **충돌로 간주**
- 충돌 발생 시 복사 실패 로그를 출력하고 **스킬 복사를 중단**
- `--force` (`-f`) 옵션 사용 시 충돌을 무시하고 덮어쓰기

### 기본 스킬 (항상 복사)

| 스킬 파일 | 설명 |
|-----------|------|
| `madang-init-project.md` | 마당 프로젝트 초기화 |
| `madang-status.md` | 프로젝트 상태 요약 |
| `madang-search.md` | 문서 검색 |
| `madang-daily-summary.md` | 일일 요약 |
| `madang-cleanup.md` | 문서 정리 |
| `madang-archive.md` | 아카이브 처리 |
| `madang-reinforce.md` | 보강해 — 구현 보강 + 테스트 |
| `madang-improve.md` | 개선해 — 개선 보고 후 실행 |
| `madang-commit.md` | 커밋해 — 커밋만 수행 |
| `madang-commit-push.md` | 커밋 푸쉬해 — 커밋 + 푸쉬 + 타스크 업데이트 |
| `madang-commit-push-only.md` | 커밋 푸쉬만해 — 커밋 + 푸쉬만 |
| `madang-record-directive.md` | 지침에 기록해 — CLAUDE.md에 지침 추가 |

### 카테고리별 스킬

| 카테고리 | 스킬 파일 | 설명 |
|----------|-----------|------|
| 티켓 | `madang-new-feature.md` | 새 피쳐 생성 |
| 티켓 | `madang-new-task.md` | 새 타스크 생성 |
| 티켓 | `madang-move-feature.md` | 피쳐 그룹 이동 |
| 티켓 | `madang-complete-task.md` | 타스크 완료 처리 |
| 티켓 | `madang-board.md` | 칸반 보드 보기 |
| 이슈 | `madang-new-issue.md` | 새 이슈 생성 |
| 이슈 | `madang-resolve-issue.md` | 이슈 해결 처리 |
| 이슈 | `madang-list-issues.md` | 미해결 이슈 목록 |
| 스펙 | `madang-new-spec.md` | 새 스펙 생성 |
| 요구사항 | `madang-new-requirement.md` | 새 요구사항 생성 |
| UI | `madang-new-wireframe.md` | 새 와이어프레임 생성 |
| UI | `madang-new-component.md` | 새 컴포넌트 명세 생성 |
| UI | `madang-new-style.md` | 새 스타일 가이드 생성 |
| 결정 | `madang-new-decision.md` | 새 결정 기록 생성 |
| 결정 | `madang-supersede-decision.md` | 결정 대체 |
| 컨벤션 | `madang-new-convention.md` | 새 컨벤션 생성 |
| 컨벤션 | `madang-check-convention.md` | 코드 컨벤션 점검 |
| 컨벤션 | `madang-list-conventions.md` | 컨벤션 목록 보기 |
| 워크스페이스 | `madang-new-workspace.md` | 새 워크스페이스 등록 |
| 워크스페이스 | `madang-workspace-status.md` | 워크스페이스 상태 요약 |
| 워크스페이스 | `madang-update-progress.md` | 진행 파일 업데이트 |
| 워크스페이스 | `madang-archive-progress.md` | 진행 기록 아카이브 |

---

## CLAUDE.md 스니펫 주입

기본 스니펫 `madang-snippet.md`는 카테고리와 관계없이 **항상** 먼저 추가됩니다.
그 후 각 카테고리 하위 폴더의 스니펫 파일이 추가됩니다:

| 스니펫 파일 | 추가 시점 |
|-------------|-----------|
| `madang-snippet.md` | **항상** (기본 스니펫) |
| `categories/tickets/ticket-snippet.md` | 티켓 카테고리 선택 시 |
| `categories/issues/issue-snippet.md` | 이슈 카테고리 선택 시 |
| `categories/specs/spec-snippet.md` | 스펙 카테고리 선택 시 |
| `categories/requirements/requirement-snippet.md` | 요구사항 카테고리 선택 시 |
| `categories/uis/ui-snippet.md` | UI 카테고리 선택 시 |
| `categories/decisions/decision-snippet.md` | 결정 카테고리 선택 시 |
| `categories/conventions/convention-snippet.md` | 컨벤션 카테고리 선택 시 |
| `categories/workspaces/workspace-snippet.md` | 워크스페이스 카테고리 선택 시 |

카테고리가 선택되면 해당 스니펫이 CLAUDE.md에 추가됩니다 (이미 존재하지 않는 경우).
CLAUDE.md가 없으면 기본 마당 스니펫과 함께 새로 생성됩니다.

> **중요:** 마당은 기존 CLAUDE.md 내용을 절대 수정하지 않습니다. 스니펫만 추가합니다.

---

## 설정 매니페스트 (`.madang/config.json`)

모든 `madang init` 실행 시 `.madang/config.json`을 생성하거나 업데이트합니다:

```json
{
  "categories": ["issue", "ticket"],
  "language": { "documents": "한국어", "commits": "English", "conversation": "한국어" }
}
```

- **추가 병합**: 새 카테고리가 기존 목록에 병합됨 (알파벳순 정렬)
- **언어 선호**: `language` 필드에 3개 영역별 언어를 저장 (마당 프로젝트 초기화 시 설정)
- **`madang status`에서 사용**: 어떤 카테고리가 활성 상태인지 표시
- 파일이 없거나 손상된 경우 다음 `madang init` 시 재생성

---

## "마당 프로젝트 초기화해" 흐름

`madang init`이 플레이스홀더 `docs/project.md`를 생성한 후, Claude가 대화를 통해 채워넣습니다:

1. `docs/project.md`를 읽고 `(placeholder)` 값이 있는지 확인
2. 사용자에게 질문: **프로젝트 이름** (필수), **설명** (필수), **저장소 URL** (선택)
3. **언어 선호** 질문 — 3가지 영역별로 사용할 언어를 선택:
   - **문서** (Documents): `docs/` 폴더의 마크다운 문서 작성 언어
   - **커밋** (Commits): Git 커밋 메시지 작성 언어
   - **대화** (Conversation): Claude와의 대화 응답 언어
   - 각 영역별로 독립 선택 가능 (예: 문서는 한국어, 커밋은 English)
   - 사용자가 별도 지정하지 않으면 현재 대화 언어를 기본값으로 사용
4. 기술 세부 사항 (기술 스택, 프로젝트 구조, 실행 방법): "직접 입력" 또는 "코드베이스에서 자동 감지" 선택지 제공
5. `docs/project.md`의 `(placeholder)` 값을 실제 내용으로 교체
6. 언어 선호를 `.madang/config.json`의 `language` 필드에도 저장

---

## 검증 체크리스트

- [ ] `.madang/` 폴더에 `madang.md`와 `project-init.md`가 존재
- [ ] `.madang/madang-snippet.md` 기본 스니펫 파일이 존재
- [ ] `docs/project.md`가 존재 (플레이스홀더 템플릿)
- [ ] `docs/user-manual.md`가 존재 (마당 사용 가이드)
- [ ] (티켓) `docs/groups/` 폴더에 4개 기본 그룹 파일 존재
- [ ] (티켓) `docs/features/.archive/` 폴더 존재
- [ ] (티켓) `docs/tasks/.completed/` 폴더 존재
- [ ] (이슈) `docs/issues/.resolved/` 폴더 존재
- [ ] (스펙) `docs/specs/` 폴더 존재
- [ ] (요구사항) `docs/requirements/.archive/` 폴더 존재
- [ ] (UI) `docs/ui/wireframes/`, `docs/ui/styles/`, `docs/ui/components/` 폴더 존재
- [ ] (결정) `docs/decisions/.superseded/` 폴더 존재
- [ ] (컨벤션) `docs/conventions/.deprecated/` 폴더 존재
- [ ] (워크스페이스) `docs/workspaces/.archive/` 폴더 존재
- [ ] `CLAUDE.md`에 마당 기본 스니펫 + 올바른 카테고리 스니펫 포함
- [ ] `.madang/config.json`에 올바른 카테고리 배열 존재
