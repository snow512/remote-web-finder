# UI 디자인 규칙

이 폴더는 프로젝트의 UI 디자인 문서를 관리합니다.
와이어프레임, 스타일 정의, 공통 컴포넌트 명세를 다룹니다.

---

## 폴더 구조

```
.madang/categories/uis/ui.md                          ← 이 파일 (규칙)

docs/ui/
├── wireframes/                           ← 와이어프레임 문서 (ASCII, 목업)
│   └── wf-{name}.md
├── styles/                               ← 스타일 가이드 및 CSS 정의
│   └── style-{name}.md
└── components/                           ← 공통 컴포넌트 명세
    └── comp-{name}.md
```

---

## 관리 규칙

1. **와이어프레임** — 페이지 레이아웃을 위한 ASCII 또는 설명적 목업
   - 파일명: `docs/ui/wireframes/wf-{name}.md`
   - 페이지 또는 주요 UI 섹션 당 하나의 파일
2. **스타일** — 색상 팔레트, 타이포그래피, 간격, 토큰
   - 파일명: `docs/ui/styles/style-{name}.md`
   - 예시: `style-colors.md`, `style-typography.md`, `style-spacing.md`
3. **컴포넌트** — 재사용 가능한 UI 컴포넌트 명세 (프레임워크 무관)
   - 파일명: `docs/ui/components/comp-{name}.md`
   - 시각적 요소, 변형, 상태, 입력, 동작 — 프레임워크 특정 문법 없이
4. **모든 파일은 YAML frontmatter 헤더가 필수** (아래 템플릿 참조)
5. **직접 수정** — UI 문서는 살아있는 문서

---

## 와이어프레임 템플릿

```
---
title: {페이지 이름} 와이어프레임
date: {YYYY-MM-DD}
status: Draft | Approved | Implemented
---

## 레이아웃

(ASCII 와이어프레임 또는 레이아웃 설명)

## 인터랙션

(클릭, 호버, 네비게이션 동작)

## 비고

(디자인 결정, 제약 사항)
```

---

## 스타일 템플릿

```
---
title: {주제}
date: {YYYY-MM-DD}
---

## 정의

(색상 값, 폰트 크기, 간격 체계 등)
```

---

## 컴포넌트 템플릿

```
---
title: {컴포넌트 이름}
date: {YYYY-MM-DD}
status: Draft | Approved | Implemented
---

## 설명
(이 컴포넌트의 역할과 책임)

## 시각적 요소
(스케치, ASCII 목업 또는 컴포넌트의 시각적 설명)

## 변형
| 변형 | 설명 |
|------|------|
| default | 기본 모양 |

## 상태
| 상태 | 설명 |
|------|------|
| default | 기본 상태 |
| hover | 마우스 오버 시 |
| disabled | 비활성 상태 |

## 입력
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|

## 동작
(인터랙션 로직: 클릭, 토글, 확장 등)

## 사용법
(이 컴포넌트를 언제, 어디서 사용하는지)
```
