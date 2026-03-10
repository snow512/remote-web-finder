# 이슈 관리 규칙

이 폴더는 프로젝트의 이슈(버그, 장애)를 관리합니다.

---

## 폴더 구조

```
.madang/categories/issues/issues.md                   ← 이 파일 (규칙)

docs/issues/
├── issue-{date}-{summary}.md            ← 미해결 이슈
└── .resolved/                            ← 해결된 이슈 아카이브
    └── {YYYY-MM}/                        ← 월별 하위 폴더 (자동 생성)
        └── issue-{date}-{summary}.md
```

---

## 관리 규칙

1. **새 이슈:** `issue-{YYYY-MM-DD}-{summary}.md` 파일 생성
2. **이슈 해결:** `.resolved/` 폴더로 이동
3. **파일명 형식:** `issue-{YYYY-MM-DD}-{summary}.md`
4. **모든 이슈 파일은 YAML frontmatter 헤더가 필수** (아래 템플릿 참조)

---

## 이슈 파일 템플릿

```
---
title: {제목}
date: {YYYY-MM-DD}
severity: Critical | High | Medium | Low
status: Open | Investigating | Resolved
related-task: (선택) task-{date}-{summary}
---

## 증상
(무슨 일이 발생했는지)

## 원인
(근본 원인 분석)

## 해결 방법
(어떻게 수정했는지)
```
