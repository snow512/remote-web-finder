# Task: Marquee Scroll + Long-Press Context Menu

- **Created:** 2026-03-02
- **Priority:** 🟡 Medium
- **Status:** 🔄 In Progress
- **Branch:** develop

---

## Goal
긴 파일명이 사이드바 트리에서 `...`으로 잘리는 문제 해결.
모바일에서 컨텍스트 메뉴 접근 수단 제공.

## Phase 1: Marquee Scroll on Active Tree Item
- [x] `.tree-item`에 `overflow: hidden` 추가
- [x] `@keyframes marqueeScroll` + `.marquee` 스타일 추가
- [x] `applyMarquee()` / `removeMarquee()` 함수 구현
- [x] `openFile()`, `loadTree()`, drag-drop에 marquee 연결
- [x] `.name` span에 `title` 속성 추가 (데스크톱 hover 툴팁)

## Phase 2: Long-Press Context Menu (Mobile)
- [x] `initLongPress()` 함수 구현 (touchstart/touchmove/touchend)
- [x] `renderTree()`에서 파일 row에 `initLongPress()` 연결
- [x] `.long-press-holding` CSS 스타일 추가

## Modified Files
- `public/style.css`
- `public/app.js`
