# 타스크 관리 규칙

이 폴더는 프로젝트의 타스크를 관리합니다.

---

## 폴더 구조

```
.madang/categories/tickets/tasks.md               ← 이 파일 (규칙)

docs/tasks/
├── task-{date}-{summary}.md          ← 개별 타스크 파일
└── .completed/                       ← 완료된 타스크 아카이브
    └── {YYYY-MM}/                    ← 월별 하위 폴더 (자동 생성)
        └── task-{date}-{summary}.md
```

---

## 관리 규칙

1. **새 타스크:** `task-{date}-{summary}.md` 파일 생성
2. **타스크 완료:** `.completed/` 폴더로 이동
3. **파일명 형식:** `task-{YYYY-MM-DD}-{summary}.md`
4. **모든 타스크 파일은 YAML frontmatter 헤더가 필수** (아래 템플릿 참조)
5. **단계 가이드:** 각 단계는 **2-3개 항목**을 포함. 너무 많으면 여러 단계로 분할

---

## 타스크 파일 템플릿

```
---
title: {제목}
date: {YYYY-MM-DD}
priority: 1-High | 2-Medium | 3-Low
status: Pending | In Progress | Done
parent-feature: (선택) feature-{date}-{summary}
---

## 개요
(이 타스크의 내용)

## 체크리스트
- [ ] 단계 1
- [ ] 단계 2
```
