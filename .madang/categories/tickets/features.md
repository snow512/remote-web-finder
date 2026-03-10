# 피쳐 관리 규칙

이 폴더는 프로젝트의 피쳐를 관리합니다.
피쳐는 여러 타스크를 하위 항목으로 포함할 수 있는 상위 수준 작업 항목입니다.

---

## 폴더 구조

```
.madang/categories/tickets/features.md                ← 이 파일 (규칙)
.madang/categories/tickets/groups.md                  ← 그룹 관리 규칙

docs/features/
├── feature-{date}-{summary}.md           ← 피쳐 파일 (플랫 구조)
└── .archive/                             ← 명시적으로 아카이브된 피쳐 (미소속 = docs/features/에 있지만 어떤 그룹에도 없는 것)

docs/groups/
├── group-plan.md                         ← 그룹 파일이 피쳐를 참조
├── group-todo.md
├── group-doing.md
└── group-done.md
```

---

## 피쳐 vs 타스크

| | 피쳐 | 타스크 |
|---|------|--------|
| **범위** | 대규모, 다단계 작업 항목 | 단일, 집중적인 작업 항목 |
| **기간** | 수일 ~ 수주 | 수시간 ~ 하루 |
| **하위 항목** | 하위 타스크 포함 | 하위 항목 없음 (말단 노드) |
| **파일 접두사** | `feature-` | `task-` |
| **위치** | `docs/features/` | `docs/tasks/` |

---

## 관리 규칙

1. **파일명 형식:** `feature-{YYYY-MM-DD}-{summary}.md`
2. **피쳐는 `docs/features/`에 플랫 파일로 관리** (하위 디렉토리 없음)
3. **피쳐는 그룹에 소속** — frontmatter의 `group` 필드를 통해. 그룹 파일(`docs/groups/group-{name}.md`)이 소속 피쳐를 나열. [groups.md](groups.md) 참조
4. **새 피쳐**는 기본적으로 `group-plan.md`에 추가
5. **피쳐 완료:** `group-done.md`로 이동 (사용자 확인 후에만)
6. **미소속 피쳐:** `docs/features/`에 있지만 어떤 그룹 파일에도 등록되지 않은 피쳐. 검토 후 그룹에 배정하거나 아카이브 처리
7. **아카이브된 피쳐:** 사용자 판단에 의해 `docs/features/.archive/`로 명시적 이동. 더 이상 활성 워크플로우에 포함되지 않음
8. **하위 타스크:** 피쳐 파일에 개별 타스크 파일 링크와 함께 나열
9. **피쳐 완료 조건:** 모든 하위 타스크가 완료되어야 완료
10. **독립 타스크 허용:** 모든 타스크가 상위 피쳐를 필요로 하지 않음. 단순한 작업은 타스크만으로 가능
11. **단계 가이드:** 피쳐를 단계(Phase)로 나누기. 각 단계는 2-3개의 타스크를 포함

---

## 피쳐 파일 템플릿

```
---
title: {제목}
date: {YYYY-MM-DD}
priority: 1-High | 2-Medium | 3-Low
status: Planning | In Progress | Done
group: plan | todo | doing | done      # slug (파일명이 아님)
---

## 개요
(이 피쳐의 기능과 이유)

## 하위 타스크

| # | 상태 | 타스크 | 파일 |
|---|------|--------|------|
| 1 | Pending | {타스크 설명} | [task-{date}-{summary}.md](../tasks/task-{date}-{summary}.md) |
| 2 | Pending | {타스크 설명} | (아직 미생성) |

## 단계

### 1단계: {단계 제목}
- [ ] 타스크 1
- [ ] 타스크 2

### 2단계: {단계 제목}
- [ ] 타스크 3
- [ ] 타스크 4
```
