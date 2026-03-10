# 마당 프로젝트 관리

마당은 마크다운 기반의 프로젝트 관리 도구로, 8개의 독립적인 카테고리를 제공합니다.
`madang init` 명령에 카테고리 플래그를 사용하여 필요한 것만 초기화할 수 있습니다.

| 카테고리 | 플래그 | 관리 대상 |
|----------|--------|-----------|
| **티켓** | `-t, --ticket` | 그룹, 피쳐, 타스크 (칸반 기반 작업 관리) |
| **이슈** | `-i, --issue` | 이슈 (버그/장애 추적) |
| **스펙** | `-s, --spec` | 스펙 (기술 참조 문서) |
| **요구사항** | `-r, --requirement` | 요구사항 (기능/비기능 요구사항 수집) |
| **UI** | `-u, --ui` | UI 디자인 (와이어프레임, 스타일, 공통 컴포넌트) |
| **결정** | `-d, --decision` | 결정 기록 (ADR — 맥락, 선택지, 근거) |
| **컨벤션** | `-c, --convention` | 코드 컨벤션 (코딩 스타일, 명명 규칙, Git 규칙) |
| **워크스페이스** | `-w, --workspace` | 워크스페이스 관리 (멀티 클론 진행 현황, 포트 체계, 환경 분리) |

각 카테고리는 독립적이며 개별적으로 선택할 수 있습니다.
`madang init -a`를 사용하면 모든 카테고리를 한 번에 초기화합니다.

---

## 거버넌스 규칙

> `madang init` 시 선택한 카테고리에 해당하는 거버넌스 파일만 생성됩니다.
> 파일이 없다면 해당 카테고리가 초기화되지 않은 것입니다.

| 카테고리 | 폴더 | 거버넌스 파일 | 내용 |
|----------|------|---------------|------|
| 티켓 | `categories/tickets/` | `groups.md`, `features.md`, `tasks.md` | 칸반 스테이지, 피쳐, 타스크 |
| 이슈 | `categories/issues/` | `issues.md` | 버그 / 장애 추적 |
| 스펙 | `categories/specs/` | `specs.md` | 기술 참조 문서 |
| 요구사항 | `categories/requirements/` | `requirements.md` | 요구사항 수집 |
| UI | `categories/uis/` | `ui.md` | 와이어프레임, 스타일, 컴포넌트 |
| 결정 | `categories/decisions/` | `decisions.md` | 아키텍처 결정 기록 (ADR) |
| 컨벤션 | `categories/conventions/` | `conventions.md` | 코드 컨벤션 (코딩 스타일, 명명, Git) |
| 워크스페이스 | `categories/workspaces/` | `workspaces.md` | 멀티 클론 진행 현황, 포트/환경 관리 |

---

## 카테고리 파일 체계

각 카테고리 폴더에는 다음 파일들이 존재할 수 있다:

| 파일 | 용도 | 필수 |
|------|------|------|
| `{name}.md` | 거버넌스 규칙 (폴더 구조, 관리 규칙, 템플릿) | 필수 |
| `{name}-guide.md` | 상세 가이드 (작업 절차, 판단 기준) | 필수 |
| `{name}-snippet.md` | CLAUDE.md에 삽입되는 요약 스니펫 | 필수 |
| `{name}-{context}-guide.md` | **확장 가이드** — 특정 환경/플랫폼별 세부 규칙 | 선택 |
| `{name}-{context}-snippet.md` | **확장 스니펫** — 확장 가이드의 CLAUDE.md 삽입 요약 | 선택 (확장 가이드 존재 시 필수) |

### 확장 가이드 (Extension Guide)

확장 가이드는 기본 가이드(`{name}-guide.md`)의 원칙을 **특정 플랫폼, 환경, 또는 맥락**에 맞게 구체화한 문서다.

- **가이드 파일명**: `{name}-{context}-guide.md` (예: `ui-mobile-guide.md`)
- **스니펫 파일명**: `{name}-{context}-snippet.md` (예: `ui-mobile-snippet.md`)
- **위치**: 해당 카테고리 폴더 내 (예: `categories/uis/`)
- **참조**: 기본 가이드의 하단에 확장 가이드 목록을 기록한다
- **스니펫 분리**: 확장 스니펫은 기본 스니펫과 **별도 파일**로 관리한다. 프로젝트에서 필요한 확장만 선택적으로 CLAUDE.md에 삽입할 수 있다. 기본 스니펫에는 확장 내용을 넣지 않는다.

```
예시 구조:
categories/uis/
├── ui.md                      ← 거버넌스 규칙
├── ui-guide.md                ← 기본 가이드
├── ui-snippet.md              ← 기본 스니펫
├── ui-mobile-guide.md         ← 확장 가이드 (모바일)
├── ui-mobile-snippet.md       ← 확장 스니펫 (모바일)
├── ui-darkmode-guide.md       ← 확장 가이드 (다크모드)
└── ui-darkmode-snippet.md     ← 확장 스니펫 (다크모드)
```

확장 가이드는 모든 카테고리에 적용 가능하다:
- UI: `ui-mobile-guide.md`, `ui-tablet-guide.md`, `ui-darkmode-guide.md`
- 컨벤션: `convention-backend-guide.md`, `convention-frontend-guide.md`
- 스펙: `spec-api-guide.md`, `spec-database-guide.md`
- 워크스페이스: `workspace-docker-guide.md`

---

## 설정 매니페스트

`.madang/config.json`에 설치된 카테고리가 기록됩니다:

```json
{ "categories": ["issue", "spec", "ticket"] }
```

- `madang init` 실행 시 자동으로 생성/업데이트됨
- 추가 방식: 새 카테고리를 기존 목록에 병합
- `madang status`에서 활성 카테고리를 표시하는 데 사용

---

## 언어 선호 (Language Preference)

프로젝트별로 3가지 영역의 언어를 설정할 수 있습니다.
`docs/project.md`의 **Language Preference** 섹션에 기록됩니다.

| 영역 | 설명 | 예시 |
|------|------|------|
| **문서** (Documents) | `docs/` 폴더의 마크다운 문서 작성 언어 | 한국어, English, 日本語 |
| **커밋** (Commits) | Git 커밋 메시지 작성 언어 | 한국어, English |
| **대화** (Conversation) | Claude와의 대화 응답 언어 | 한국어, English |

- "마당 프로젝트 초기화해" 흐름에서 사용자에게 언어 선호를 질문
- `docs/project.md`에 기록되면 Claude는 이를 따름
- 미설정 시 기본값: 사용자가 사용하는 언어를 따름

---

## 파일 소유권

마당이 관리하는 파일과 프로젝트 파일은 명확히 구분된다.

| 구분 | 경로 | 설명 |
|------|------|------|
| **마당 파일** | `.madang/` | 거버넌스 규칙, config, snippets — 마당 자체의 설정 |
| **프로젝트 문서** | `docs/` | `.madang/` 규칙에 의해 생성·관리되는 결과물 (tasks, features, issues 등) |
| **프로젝트 파일** | `CLAUDE.md` 등 | 프로젝트 소유. 마당은 snippets 추가로만 소통 |

- `madang export` 기본 대상은 `.madang/`만 포함 (마당 파일)
- `docs/`는 `--docs` 옵션으로 선택적 포함 (프로젝트 문서)
- `CLAUDE.md`는 내보내기 대상이 아님 — import 후 `madang init`으로 snippets를 재연결

---

- [프로젝트 초기화 가이드](project-init.md) — `madang init` CLI 명세
