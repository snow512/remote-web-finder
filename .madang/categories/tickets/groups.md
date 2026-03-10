# 그룹 관리 규칙

그룹은 피쳐를 워크플로우 단계별로 정리합니다.
각 그룹은 소속된 피쳐 목록을 포함하는 파일입니다.

---

## 폴더 구조

```
.madang/categories/tickets/groups.md                  ← 이 파일 (규칙)

docs/groups/
├── group-plan.md                         ← 기획 단계
├── group-todo.md                         ← 시작 대기
├── group-doing.md                        ← 진행 중
├── group-done.md                         ← 완료
└── group-{snake-case-name}.md            ← 커스텀 그룹
```

---

## 기본 그룹

| 그룹 | 파일 | 설명 |
|------|------|------|
| Plan | `group-plan.md` | 설계 또는 기획 중인 피쳐 |
| ToDo | `group-todo.md` | 승인되어 시작 대기 중인 피쳐 |
| Doing | `group-doing.md` | 현재 작업 중인 피쳐 |
| Done | `group-done.md` | 완료된 피쳐 (사용자 확인 후) |

---

## 관리 규칙

1. **파일명 형식:** `group-{snake-case-name}.md`
2. **모든 그룹 파일은 YAML frontmatter 헤더가 필수** (아래 템플릿 참조)
3. **그룹은 피쳐 목록을 포함** — 피쳐 파일에 대한 링크가 있는 테이블 형태
4. **피쳐는 그룹 간 이동 가능** — 그룹 파일과 피쳐의 `group` 필드를 함께 수정
5. **미소속 피쳐:** `docs/features/`에 있지만 어떤 그룹 파일에도 등록되지 않은 피쳐. 검토 후 그룹에 배정하거나 아카이브 처리
6. **아카이브된 피쳐:** 사용자 판단에 의해 `docs/features/.archive/`로 명시적으로 이동된 피쳐. 더 이상 활성 워크플로우에 포함되지 않음
7. **커스텀 그룹**은 동일한 형식으로 생성 가능
8. **order 필드**로 표시 순서 결정 (숫자가 작을수록 앞에 표시)

---

## 그룹 파일 템플릿

```
---
title: {그룹 이름}
description: {이 그룹이 나타내는 것}
order: {N}
---

## 피쳐 목록

| # | 우선순위 | 피쳐 | 파일 |
|---|----------|------|------|
| 1 | 1-High | {피쳐 제목} | [feature-{date}-{summary}.md](../features/feature-{date}-{summary}.md) |
```
