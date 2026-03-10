# 요구사항 관리 규칙

이 폴더는 프로젝트의 요구사항(기능, 비기능)을 관리합니다.
요구사항은 시스템이 수행해야 할 것을 정의합니다 — 이해관계자, 사용자 스토리 또는 도메인 분석에서 수집됩니다.

---

## 폴더 구조

```
.madang/categories/requirements/requirements.md       ← 이 파일 (규칙)

docs/requirements/
├── req-{date}-{summary}.md              ← 활성 요구사항
└── .archive/                             ← 아카이브된 요구사항
    └── req-{date}-{summary}.md
```

---

## 관리 규칙

1. **새 요구사항:** `req-{YYYY-MM-DD}-{summary}.md` 파일 생성
2. **요구사항 아카이브:** `.archive/` 폴더로 이동
3. **파일명 형식:** `req-{YYYY-MM-DD}-{summary}.md`
4. **모든 요구사항 파일은 YAML frontmatter 헤더가 필수** (아래 템플릿 참조)
5. **직접 수정** — 요구사항은 살아있는 문서이며, 세부 사항이 변경되면 직접 편집
6. **상태 수명 주기:** Draft → Confirmed → Changed → Archived

---

## 요구사항 파일 템플릿

```
---
title: {제목}
date: {YYYY-MM-DD}
last-updated: {YYYY-MM-DD}
status: Draft | Confirmed | Changed | Archived
category: Functional | Non-Functional | Constraint
priority: 1-High | 2-Medium | 3-Low
---

## 설명
(시스템이 수행해야 할 것)

## 인수 조건
- [ ] 조건 1
- [ ] 조건 2

## 비고
(추가 맥락, 제약 사항 또는 참조)

## 변경 이력
| 날짜 | 변경 내용 |
|------|-----------|
| {YYYY-MM-DD} | 초기 요구사항 수집 |
```
