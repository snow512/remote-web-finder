# Task: TypeScript 마이그레이션 + 컴포넌트화

- **Date:** 2026-03-17
- **Priority:** 🔴 High
- **Status:** Done

## Goal

프로젝트를 JavaScript에서 TypeScript로 전환하고, 모놀리식 파일들을 구조적으로 분리한다.

## Phases

### Phase 1: TypeScript 환경 설정 + 서버 변환
- [x] tsconfig.json 설정
- [x] TypeScript, @types 의존성 추가
- [x] server.js → src/server/ 분리 (app.ts, routes/, cli.ts, utils/)
- [x] 빌드 스크립트 설정

### Phase 2: 공유 유틸리티 변환
- [x] utils.js → src/shared/utils.ts
- [x] 공유 타입 정의 (TreeItem 등)

### Phase 3: 클라이언트 TypeScript 변환 + 컴포넌트 분리
- [x] Vite 설정 (클라이언트 번들링)
- [x] app.js 3400줄 → 30+ 모듈 파일로 분리
  - state.ts, api.ts, constants.ts
  - components/: toast, dialog, theme, icons, breadcrumb, preview, search, status-bar, zoom, settings, focus-mode, context-menu
  - components/tree/: helpers, render, navigation, filter
  - components/editor/: editor, toolbar, draft, line-numbers
  - components/sidebar/: recent, favorites, sections, resize, custom-filters
  - utils/: dom.ts

### Phase 4: 테스트/빌드/패키지 업데이트
- [x] server.js를 dist wrapper로 변경 (기존 테스트 호환)
- [x] package.json 업데이트 (bin, scripts, files)
- [x] 빌드 및 테스트 통과 확인 (196 tests passed)

## Result Structure

```
src/
├── server/                    (Express 서버 - TypeScript)
│   ├── index.ts               (CLI entry point)
│   ├── app.ts                 (Express app factory)
│   ├── routes/
│   │   ├── tree.ts
│   │   ├── file.ts
│   │   ├── folder.ts
│   │   ├── rename.ts
│   │   └── version.ts
│   └── utils/
│       ├── pattern.ts
│       ├── ignore.ts
│       └── safePath.ts
├── client/                    (Vite + TypeScript)
│   ├── main.ts                (entry point + boot)
│   ├── index.html
│   ├── style.css
│   ├── state.ts
│   ├── api.ts
│   ├── constants.ts
│   ├── components/
│   │   ├── toast.ts
│   │   ├── dialog.ts
│   │   ├── theme.ts
│   │   ├── icons.ts
│   │   ├── breadcrumb.ts
│   │   ├── preview.ts
│   │   ├── search.ts
│   │   ├── status-bar.ts
│   │   ├── zoom.ts
│   │   ├── settings.ts
│   │   ├── focus-mode.ts
│   │   ├── context-menu.ts
│   │   ├── tree/
│   │   │   ├── helpers.ts
│   │   │   ├── render.ts
│   │   │   ├── navigation.ts
│   │   │   └── filter.ts
│   │   ├── editor/
│   │   │   ├── editor.ts
│   │   │   ├── toolbar.ts
│   │   │   ├── draft.ts
│   │   │   └── line-numbers.ts
│   │   └── sidebar/
│   │       ├── recent.ts
│   │       ├── favorites.ts
│   │       ├── sections.ts
│   │       ├── resize.ts
│   │       └── custom-filters.ts
│   └── utils/
│       └── dom.ts
├── shared/                    (서버/클라이언트 공유)
│   ├── utils.ts
│   └── types.ts
```

## Build Commands

```bash
npm run build          # 서버(tsc) + 클라이언트(vite) 빌드
npm run build:server   # 서버만 빌드
npm run build:client   # 클라이언트만 빌드
npm run dev            # 빌드된 서버 실행
npm test               # 테스트 (196 tests)
npm run typecheck      # 타입 체크 (서버 + 클라이언트)
```
