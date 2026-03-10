# 결정 기록 규칙

이 폴더는 프로젝트의 아키텍처 및 기술 결정 기록(ADR)을 관리합니다.
결정 기록은 주요 선택의 맥락, 검토한 선택지, 근거를 기록합니다.

---

## 폴더 구조

```
.madang/categories/decisions/decisions.md             ← 이 파일 (규칙)

docs/decisions/
├── adr-{date}-{summary}.md              ← 활성 결정
└── .superseded/                          ← 대체된 결정
    └── adr-{date}-{summary}.md
```

---

## 관리 규칙

1. **새 결정:** `adr-{YYYY-MM-DD}-{summary}.md` 파일 생성
2. **결정 대체:** `.superseded/` 폴더로 이동하고 새 결정에 링크
3. **파일명 형식:** `adr-{YYYY-MM-DD}-{summary}.md`
4. **모든 결정 파일은 YAML frontmatter 헤더가 필수** (아래 템플릿 참조)
5. **수락된 결정은 불변** — 결론을 수정하지 않고, 대체하려면 새 결정을 생성
6. **상태 수명 주기:** Proposed → Accepted → Deprecated 또는 Superseded

---

## 결정 파일 템플릿

```
---
title: {제목}
date: {YYYY-MM-DD}
status: Proposed | Accepted | Deprecated | Superseded
superseded-by: (선택) adr-{date}-{summary}
---

## 맥락
(이 결정이 필요한 이유 — 문제 또는 상황)

## 검토한 선택지

### 선택지 A: {이름}
- 장점: ...
- 단점: ...

### 선택지 B: {이름}
- 장점: ...
- 단점: ...

## 결정
(어떤 선택지를 선택했고 그 이유)

## 결과
(이 결정의 결과로 변경되는 것)
```
