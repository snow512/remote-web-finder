# 프로젝트 초기화 지침

이 파일은 Claude에게 **"이 파일을 수행해"**라고 지시하면, 프로젝트의 docs 구조와 Claude 설정을 자동으로 생성하는 지침서입니다.

---

## 사전 요구사항

- Git 저장소가 초기화되어 있어야 합니다
- Node.js 프로젝트 (`package.json` 존재)

## 변수

아래 값을 프로젝트에 맞게 치환하세요:

| 변수 | 값 | 설명 |
|------|------|------|
| `{PROJECT_NAME}` | Remote Web Finder | 프로젝트 표시명 |
| `{PROJECT_DESC}` | Local markdown document viewer and editor | 프로젝트 설명 |

---

## 1단계: docs 디렉토리 구조 생성

```bash
mkdir -p docs/specs
mkdir -p docs/tasks/.completed
mkdir -p docs/issues/.resolved

touch docs/specs/.gitkeep
touch docs/tasks/.completed/.gitkeep
touch docs/issues/.resolved/.gitkeep
```

### 생성할 파일 목록

#### `docs/tasks/tasks.md` — 작업 관리 규칙

```markdown
# Task 관리 규칙

이 폴더는 **{PROJECT_NAME}** 프로젝트의 작업을 관리합니다.

---

## 폴더 구조

docs/tasks/
├── tasks.md                  ← 이 파일 (규칙만)
├── todos.md                  ← 기능 개선 TODO 목록
├── task-{날짜}-{요약}.md     ← 개별 작업 파일
└── .completed/               ← 완료된 작업 아카이브
    └── 2026-01/              ← 년월별 분리 폴더
        └── task-{날짜}-{요약}.md

---

## 상태 범례

**우선순위:** `🔴 높음` `🟡 중간` `🟢 낮음`

---

## 관리 규칙

1. **새 작업 추가:** `task-{날짜}-{요약}.md` 파일 생성
2. **작업 완료 시:** `.completed/` 폴더로 이동
3. **파일명 형식:** `task-{YYYY-MM-DD}-{요약}.md`
4. **파일 내용:** 담당, 우선순위, 상태, 체크리스트 포함
5. **기능 개선 작업 시:** `todos.md`에서 항목을 선택하고, 착수 시 task 파일 생성 후 todos.md에 링크 추가
6. **작업 완료 후:** todos.md의 해당 항목을 `[x]`로 체크하고, task 파일을 `.completed/`로 이동
7. **Phase 작성 시:** 각 Phase는 **2~3가지 항목**으로 구성. 한 Phase가 커지면 여러 Phase로 분할

---

## 연관 문서

- 기능 개선 TODO: [`todos.md`](todos.md)
- 이슈 관리: [`/docs/issues/issues.md`](../issues/issues.md)
```

#### `docs/tasks/todos.md` — TODO 목록 템플릿

```markdown
# 기능 개선 TODO

현재 구현된 기능 기반으로, 개선 항목을 우선순위별로 정리합니다.
작업 착수 시 `task-{YYYY-MM-DD}-{요약}.md` 파일을 생성하세요.

### 범례
- **구분:** `feature` = 복합 큰 기능 / `task` = 단일 단순 기능
- **난이도:** ⬜ 쉬움 (수시간) / 🟧 보통 (1~2일) / 🟥 어려움 (3일+)
- **우선순위:** 1(최우선) ~ 5(나중에)

---

| # | 우선순위 | 구분 | 난이도 | 항목 | 비고 |
|---|---------|------|--------|------|------|
| | | | | | |

---

## 완료 이력

<details>
<summary>완료된 항목 (클릭하여 펼치기)</summary>

(없음)

</details>
```

#### `docs/issues/issues.md` — 이슈 관리 규칙

```markdown
# Issue 관리 규칙

이 폴더는 **{PROJECT_NAME}** 프로젝트의 이슈(버그, 장애)를 관리합니다.

---

## 폴더 구조

docs/issues/
├── issues.md                     ← 이 파일 (규칙 + 인덱스)
├── issue-{날짜}-{요약}.md        ← 미해결 이슈
└── .resolved/                    ← 해결된 이슈 아카이브
    └── 2026-01/                  ← 년월별 분리 폴더
        └── issue-{날짜}-{요약}.md

---

## 관리 규칙

1. **새 이슈 등록:** `issue-{YYYY-MM-DD}-{요약}.md` 파일 생성
2. **이슈 해결 시:** `.resolved/` 폴더로 이동
3. **파일명 형식:** `issue-{YYYY-MM-DD}-{요약}.md`
4. **파일 내용:** 날짜, 상태, 증상, 원인, 해결 방법 포함

> Task 관리 규칙은 [`/docs/tasks/tasks.md`](../tasks/tasks.md) 참고

---

## 미해결 이슈

| 날짜 | 이슈 | 파일 |
|------|------|------|
| (없음) | | |

---

## 해결된 이슈

| 날짜 | 이슈 | 파일 |
|------|------|------|
| (없음) | | |
```

#### `docs/decisions.md` — 기술 결정사항

```markdown
# 기술 결정사항 (Architecture Decisions)

프로젝트의 핵심 기술 선택 및 아키텍처 결정사항을 기록합니다.

---

## 기술 스택

| 영역 | 선택 | 근거 |
|------|------|------|
| | | |

---

(섹션을 추가하여 결정사항을 기록하세요)
```

---

## 2단계: CLAUDE.md 생성

프로젝트 루트에 `CLAUDE.md` 파일을 생성합니다.
(별도 템플릿 참조 — 범용화된 작업 규칙, docs 구조, 슬래시 커맨드 참조 포함)

---

## 3단계: .claude 설정

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

## 4단계: .gitignore 업데이트

`.gitignore`에 아래 항목이 없으면 추가:

```
.claude/
.temp/
```

---

## 검증 체크리스트

- [ ] `docs/specs/` 폴더 존재
- [ ] `docs/tasks/tasks.md` 존재 및 내용 확인
- [ ] `docs/tasks/todos.md` 존재
- [ ] `docs/tasks/.completed/` 폴더 존재
- [ ] `docs/issues/issues.md` 존재 및 내용 확인
- [ ] `docs/issues/.resolved/` 폴더 존재
- [ ] `docs/decisions.md` 존재
- [ ] `CLAUDE.md` 존재
- [ ] `.claude/settings.local.json` 존재
- [ ] `.gitignore`에 `.claude/`, `.temp/` 포함
- [ ] 프로젝트 특화 내용 없음 (범용 템플릿만)
