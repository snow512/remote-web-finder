# Task: 로그 강화 + 에러 바운더리 강화

- **Date:** 2026-03-17
- **Priority:** 🟡 Medium
- **Status:** Done

## Goal

TypeScript 마이그레이션 후 로그/에러 처리를 개선한다. `console.error` 대신 구조화된 로거를 사용하고, 클라이언트에 내부 에러 메시지 노출을 차단하며, 전역 에러 핸들러를 추가한다.

## Changes

### Server
- [x] `src/server/utils/logger.ts` — 타임스탬프 + 레벨 + 메시지 + 메타 구조화 로깅
- [x] `src/server/app.ts` — 요청 로깅 미들웨어 + 글로벌 에러 핸들러
- [x] `src/server/routes/file.ts` — logger 사용, 에러 메시지 은닉
- [x] `src/server/routes/folder.ts` — 동일
- [x] `src/server/routes/rename.ts` — 동일
- [x] `src/server/routes/tree.ts` — 동일
- [x] `src/server/routes/version.ts` — try-catch + logger

### Client
- [x] `src/client/utils/logger.ts` — `createLogger(component)` 팩토리
- [x] `src/client/main.ts` — `window.onerror` + `unhandledrejection` 핸들러
- [x] `src/client/components/preview.ts` — marked/hljs try-catch 래핑
- [x] `src/client/components/editor/editor.ts` — updateLivePreview try-catch

## Verification
- [x] `npm run build` 성공
- [x] `npm test` 196개 테스트 통과
