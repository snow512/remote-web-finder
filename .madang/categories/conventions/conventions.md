# 코드 컨벤션 관리 규칙

이 폴더는 프로젝트의 코드 컨벤션(코딩 규칙, 명명 규칙, 구조 규칙)을 관리합니다.
컨벤션 문서는 팀원과 AI가 일관된 코드를 작성하기 위한 기준입니다.

---

## 폴더 구조

```
.madang/categories/conventions/conventions.md        ← 이 파일 (규칙)
.madang/categories/conventions/convention-guide.md   ← 컨벤션 작성 가이드

docs/conventions/
├── conv-{name}.md                       ← 개별 컨벤션 문서
└── .deprecated/                         ← 폐기된 컨벤션
    └── conv-{name}.md
```

---

## 관리 규칙

1. **새 컨벤션:** `conv-{name}.md` 파일 생성 (주제별로 분리)
2. **컨벤션 폐기:** `.deprecated/` 폴더로 이동하고 대체 컨벤션에 링크
3. **파일명 형식:** `conv-{name}.md` — 주제를 나타내는 간결한 영문 (소문자, 하이픈 구분)
4. **모든 컨벤션 파일은 YAML frontmatter 헤더가 필수** (아래 템플릿 참조)
5. **직접 수정** — 컨벤션은 살아있는 문서이며, 합의에 의해 직접 편집
6. **코드 작성 시 항상 참조** — AI와 팀원 모두 컨벤션을 따름

---

## 컨벤션 유형

| 유형 | 설명 | 파일명 예시 |
|------|------|-------------|
| 코딩 스타일 | 들여쓰기, 따옴표, 세미콜론 등 | `conv-coding-style.md` |
| 명명 규칙 | 변수, 함수, 파일, 컴포넌트 이름 | `conv-naming.md` |
| 파일 구조 | 디렉토리 레이아웃, 모듈 구성 | `conv-file-structure.md` |
| Git 규칙 | 커밋 메시지, 브랜치 명명, PR 규칙 | `conv-git.md` |
| 에러 처리 | 예외 처리, 로깅, 에러 응답 패턴 | `conv-error-handling.md` |
| 테스트 | 테스트 작성, 명명, 구조 규칙 | `conv-testing.md` |
| API | 엔드포인트 설계, 응답 형식, 버전 관리 | `conv-api.md` |
| 주석/문서 | 주석 작성, JSDoc, README 규칙 | `conv-documentation.md` |

---

## 컨벤션 파일 템플릿

```
---
title: {제목}
scope: project | frontend | backend | shared
last-updated: {YYYY-MM-DD}
---

## 개요
(이 컨벤션의 목적과 적용 범위)

## 규칙

### 규칙 1: {제목}
- **좋은 예:**
  ```
  (올바른 코드 예시)
  ```
- **나쁜 예:**
  ```
  (피해야 할 코드 예시)
  ```

### 규칙 2: {제목}
- **좋은 예:**
  ```
  (올바른 코드 예시)
  ```
- **나쁜 예:**
  ```
  (피해야 할 코드 예시)
  ```

## 예외
(이 규칙을 따르지 않아도 되는 경우)

## 참조
(관련 린터 설정, 외부 스타일 가이드 링크 등)
```
