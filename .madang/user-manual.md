# 마당 (Madang) 퀵 가이드

마당은 마크다운 기반 프로젝트 관리 도구입니다.
CLI로 초기화하고, 웹 대시보드로 관리하고, AI(Claude)와 함께 문서를 작성합니다.

---

## 설치

```bash
npm install -g madang-ai
```

---

## 빠른 시작

```bash
# 1. 프로젝트 폴더로 이동
cd my-project

# 2. 마당 초기화 (전체 카테고리)
madang init -a

# 3. 웹 대시보드 실행
madang serve

# 브라우저에서 http://localhost:7001 접속
```

---

## CLI 명령어

### `madang init` — 프로젝트 초기화

필요한 카테고리만 선택하여 초기화합니다.

```bash
madang init -a              # 전체 카테고리
madang init -t              # 티켓 (그룹/피쳐/타스크)
madang init -i              # 이슈 추적
madang init -s              # 기술 스펙
madang init -r              # 요구사항
madang init -u              # UI 디자인
madang init -d              # 결정 기록 (ADR)
madang init -c              # 코드 컨벤션
madang init -w              # 워크스페이스 (멀티 클론 관리)
madang init -tis            # 조합 가능
madang init -a -f           # 강제 재초기화
```

초기화하면 `.madang/` (규칙)과 `docs/` (문서) 폴더가 생성됩니다.

### `madang serve` — 웹 대시보드 실행

```bash
madang serve                # 포그라운드 실행 (기본 포트 7001)
madang serve -p 8080        # 포트 지정
madang serve -b             # 백그라운드 실행
```

### `madang stop` — 백그라운드 서버 중지

```bash
madang stop
```

### `madang status` — 프로젝트 현황 요약

```bash
madang status               # 카테고리별 문서 수, 상태 요약
madang status --json        # JSON 출력
```

### `madang export` / `madang import` — 내보내기/가져오기

```bash
madang export               # .madang/ 폴더만 내보내기
madang export --docs        # docs/ 포함하여 내보내기
madang import backup.tar.gz # 아카이브에서 복원
madang import backup.tar.gz -f  # 기존 파일 덮어쓰기
```

---

## 빠른 참조

| 항목 | 경로 |
|------|------|
| 프로젝트 요약 | `docs/project.md` |
| 관리 규칙 (중앙) | `.madang/madang.md` |
| 카테고리 거버넌스 | `.madang/categories/<카테고리>/*.md` |
| 프로젝트 문서 | `docs/<카테고리>/` |
| 활성 카테고리 | `.madang/config.json` |

---

## 폴더 구조

초기화 후 생성되는 구조:

```
my-project/
├── .madang/                # 관리 규칙 (거버넌스)
│   ├── madang.md           # 중앙 규칙
│   ├── config.json         # 활성 카테고리
│   └── categories/         # 카테고리별 규칙
│       ├── tickets/        # 티켓 규칙 (groups, features, tasks)
│       ├── issues/         # 이슈 규칙
│       ├── specs/          # 스펙 규칙
│       ├── requirements/   # 요구사항 규칙
│       ├── uis/            # UI 디자인 규칙
│       ├── decisions/      # 결정 기록 규칙
│       ├── conventions/    # 코드 컨벤션 규칙
│       └── workspaces/     # 워크스페이스 관리 규칙
├── docs/                   # 프로젝트 문서
│   ├── project.md          # 프로젝트 요약
│   ├── groups/             # 칸반 스테이지
│   ├── features/           # 피쳐
│   ├── tasks/              # 타스크
│   ├── issues/             # 이슈
│   ├── specs/              # 기술 스펙
│   ├── requirements/       # 요구사항
│   ├── decisions/          # 결정 기록
│   ├── ui/                 # UI 디자인
│   ├── conventions/        # 코드 컨벤션
│   └── workspaces/         # 워크스페이스 진행 현황
└── CLAUDE.md               # Claude AI 진입점
```

---

## 웹 대시보드 기능

`madang serve` 실행 후 브라우저에서 사용 가능:

| 페이지 | 설명 |
|--------|------|
| 대시보드 | 프로젝트 전체 현황 한눈에 보기 |
| 칸반 보드 | 그룹별 피쳐를 드래그&드롭으로 관리 |
| 피쳐 | 피쳐 목록 조회/생성/수정 |
| 타스크 | 타스크 목록 조회/생성/수정 |
| 이슈 | 버그/장애 추적 |
| 스펙 | 기술 참조 문서 |
| 요구사항 | 기능/비기능 요구사항 |
| 결정 | 아키텍처 결정 기록 (ADR) |
| UI 디자인 | 와이어프레임, 스타일, 컴포넌트 |
| 코드 컨벤션 | 코딩 스타일, 명명 규칙, Git 규칙 |
| 워크스페이스 | 멀티 클론 진행 현황, 포트 체계, 환경 분리 |

---

## Claude와 함께 사용하기

마당은 `CLAUDE.md`를 통해 Claude AI와 연동됩니다.
`madang init` 시 `.claude/skills/`에 스킬 파일이 설치되며, Claude Code에서 자연어 명령으로 프로젝트를 관리할 수 있습니다.

```bash
# 초기화 후 Claude Code에서 바로 사용
claude

# Claude에게 명령 예시:
# "마당 프로젝트 초기화해" — project.md 플레이스홀더를 대화로 채움
# "타스크 기록해" — 현재 작업을 타스크로 기록
# "이슈 만들어" — 새 이슈 생성
# "진행사항 파악해" — 현재 진행 상태 확인
# "커밋 푸쉬해" — 커밋 + 푸쉬 + 타스크 업데이트
```

---

## Claude 스킬 가이드

`madang init` 시 자동으로 설치되는 Claude 스킬 목록입니다.
Claude Code에서 슬래시 명령(`/madang-...`) 또는 자연어로 사용할 수 있습니다.

### 기본 스킬 (항상 설치)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-init-project` | "마당 프로젝트 초기화해" | `docs/project.md`의 플레이스홀더를 대화로 채우고 언어 선호를 설정 |
| `madang-status` | "진행사항 파악해" | 활성 카테고리별 문서 수와 진행 현황 요약 |
| `madang-search` | "문서에서 검색해" | `docs/` 폴더의 모든 마크다운 파일에서 키워드 검색 |
| `madang-daily-summary` | "오늘 요약해" | 오늘 변경된 문서, 진행 중 타스크, 미해결 이슈 정리 |
| `madang-cleanup` | "문서 정리해" | 미소속 피쳐, 오래된 타스크, 상태 불일치 점검 및 정리 제안 |
| `madang-archive` | "아카이브해" | 완료된 문서를 카테고리별 아카이브 폴더로 이동 |
| `madang-reinforce` | "보강해" | 기존 구현의 문제점을 찾아 수정하고 테스트까지 완료 |
| `madang-improve` | "개선해" | 개선 내용을 먼저 보고한 후 승인된 항목만 수행 |
| `madang-commit` | "커밋해" | 변경사항을 커밋만 수행 (푸쉬 없음) |
| `madang-commit-push` | "커밋 푸쉬해", "커푸" | 커밋 + 푸쉬 + 관련 타스크 자동 업데이트 |
| `madang-commit-push-only` | "커밋 푸쉬만해" | 커밋 + 푸쉬만 수행 (타스크 업데이트 없음) |
| `madang-record-directive` | "지침에 기록해" | CLAUDE.md의 관리 지침 섹션에 새 지침 추가 |

### 티켓 스킬 (`-t`)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-new-feature` | "피쳐 만들어" | 제목/설명/우선순위를 물어보고 `docs/features/`에 생성, Plan 그룹에 등록 |
| `madang-new-task` | "타스크 기록해" | 제목/설명/상위 피쳐를 물어보고 `docs/tasks/`에 생성 |
| `madang-move-feature` | "피쳐 이동해" | 피쳐를 다른 칸반 그룹(Plan→ToDo→Doing→Done)으로 이동 |
| `madang-complete-task` | "타스크 완료해" | 타스크를 Done 처리하고 `docs/tasks/.completed/`로 이동 |
| `madang-board` | "칸반 보드 보여줘" | 모든 그룹과 소속 피쳐를 텍스트 칸반 보드로 출력 |

### 이슈 스킬 (`-i`)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-new-issue` | "이슈 만들어" | 증상/심각도를 물어보고 `docs/issues/`에 이슈 파일 생성 |
| `madang-resolve-issue` | "이슈 해결해" | 원인/해결 방법을 기록하고 `docs/issues/.resolved/`로 이동 |
| `madang-list-issues` | "이슈 목록 보여줘" | 미해결 이슈를 심각도순으로 출력 |

### 스펙 스킬 (`-s`)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-new-spec` | "스펙 만들어" | 주제/개요를 물어보고 `docs/specs/`에 기술 참조 문서 생성 (코드베이스 자동 감지 지원) |

### 요구사항 스킬 (`-r`)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-new-requirement` | "요구사항 만들어" | 설명/카테고리(Functional·Non-Functional·Constraint)/인수 조건을 물어보고 생성 |

### UI 스킬 (`-u`)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-new-wireframe` | "와이어프레임 만들어" | 페이지 레이아웃을 ASCII 와이어프레임으로 작성하여 `docs/ui/wireframes/`에 저장 |
| `madang-new-component` | "컴포넌트 명세 만들어" | 컴포넌트의 변형/상태/속성을 정의하여 `docs/ui/components/`에 저장 |
| `madang-new-style` | "스타일 가이드 만들어" | 색상/타이포그래피/간격 등 디자인 토큰을 `docs/ui/styles/`에 저장 |

### 결정 스킬 (`-d`)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-new-decision` | "결정 기록해" | 맥락/선택지/근거를 문서화하여 `docs/decisions/`에 ADR 생성 |
| `madang-supersede-decision` | "결정 대체해" | 기존 ADR을 `.superseded/`로 이동하고 새 결정 생성 |

### 컨벤션 스킬 (`-c`)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-new-convention` | "컨벤션 만들어" | 범위(project/frontend/backend)/규칙/예외를 정의하여 `docs/conventions/`에 생성 |
| `madang-check-convention` | "컨벤션 점검해" | 코드가 정의된 컨벤션을 준수하는지 대조 점검, 위반 사항 보고 |
| `madang-list-conventions` | "컨벤션 목록 보여줘" | 정의된 모든 컨벤션을 scope별로 그룹화하여 출력 |

### 워크스페이스 스킬 (`-w`)

| 스킬 | 트리거 예시 | 설명 |
|------|-------------|------|
| `madang-new-workspace` | "워크스페이스 등록해" | 클론 디렉토리/포트 할당/환경 설정을 물어보고 `docs/workspaces/`에 등록 |
| `madang-workspace-status` | "워크스페이스 현황 보여줘" | 모든 워크스페이스의 진행 중 작업, 브랜치, 포트 현황 요약 |
| `madang-update-progress` | "진행상황 기록해" | 현재 워크스페이스의 진행 파일(작업/브랜치/단계) 업데이트 |
| `madang-archive-progress` | "진행 기록 아카이브해" | 완료된 진행 항목을 `docs/workspaces/.archive/`로 정리 |

---

## 자주 묻는 질문

**Q: 이미 초기화된 프로젝트에 카테고리를 추가할 수 있나요?**
A: 네. `madang init -i`처럼 추가할 카테고리만 지정하면 됩니다. 기존 파일은 덮어쓰지 않습니다.

**Q: 포트를 변경하려면?**
A: `madang serve -p 8080`으로 원하는 포트를 지정하세요.

**Q: 백그라운드로 실행하려면?**
A: `madang serve -b`로 실행하고, `madang stop`으로 중지합니다.

**Q: 다른 프로젝트로 설정을 옮기려면?**
A: `madang export`로 내보내고, 대상 프로젝트에서 `madang import`로 가져옵니다.
