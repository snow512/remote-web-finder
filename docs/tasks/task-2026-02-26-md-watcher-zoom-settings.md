# MD Watcher: 줌 개선 + 설정 페이지 추가

**생성일:** 2026-02-26
**우선순위:** 🟡 중간
**브랜치:** `feature/docs-viewer`
**상태:** 완료

---

## 목표
- 줌(Ctrl++/-)이 텍스트/이미지 컨텍스트별로 분리되어 동작
- 폰트 크기, 테마, 줄바꿈 등을 조정할 설정 다이얼로그 추가

## Phase 1: 줌 시스템 리팩터 (텍스트/이미지 분리)

- [x] `IMAGE_ZOOM_KEY` 상수 + `imageZoomLevel` 상태변수 추가
- [x] `applyImageZoom()` → CSS 변수 `--image-zoom` 설정
- [x] `zoomIn()`/`zoomOut()`/`zoomReset()` 내부에서 `isImageFile(currentPath)` 체크
- [x] CSS `.image-preview img`에 `transform: scale(var(--image-zoom, 1))` + `overflow: auto`

## Phase 2: 설정 다이얼로그 UI (HTML + CSS)

- [x] `#settingsOverlay` HTML (폰트 크기, 테마, 줄바꿈, 줌 리셋)
- [x] 설정 CSS (overlay, dialog, row 스타일)
- [x] toolbar에 기어 아이콘 `#btnSettings` 추가
- [x] 단축키 도움말에 `Ctrl+,` 추가

## Phase 3: 설정 다이얼로그 로직 (app.js)

- [x] `FONT_SIZE_KEY`, `baseFontSize` 상태 + `applyFontSize()`
- [x] CSS 변수 `--base-font-size` 통합 (preview, editor, line-numbers, live-preview)
- [x] 설정 이벤트: 열기/닫기, 폰트 크기 +/-, 테마/줄바꿈 토글, 줌 리셋

---

## 수정 파일
- `public/app.js`
- `public/style.css`
- `public/index.html`
