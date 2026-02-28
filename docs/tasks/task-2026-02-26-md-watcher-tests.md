# md-watcher 테스트 코드 작성

**우선순위:** 🟡 중간
**상태:** 완료
**브랜치:** `feature/docs-viewer`
**생성일:** 2026-02-26

---

## 목표
md-watcher의 server.js에 대한 테스트 코드 작성. API 엔드포인트, 유틸 함수(패턴 매칭, 트리 빌드, 경로 보안)를 검증.

## Phase 1: 리팩터 + 테스트 작성

- [x] server.js 리팩터: `createApp()` 팩토리 분리, `module.exports` 추가, CLI 로직을 `require.main === module` 가드
- [x] server.test.js 신규 생성 (Jest + Supertest)
- [x] package.json에 jest + supertest devDeps, test 스크립트 추가
- [x] `npm test` 통과 확인 — **40 tests passed (0.52s)**

### 테스트 범위
1. **유틸 함수 단위 테스트**: matchPattern() — 정확 매칭, 와일드카드, 디렉토리 슬래시
2. **API 통합 테스트**: GET /api/tree, GET /api/file, GET /api/raw, PUT /api/file, POST /api/file, PATCH /api/file, DELETE /api/file, POST /api/folder, DELETE /api/folder
3. **보안 테스트**: ../ 탈출 차단 (safePath)
