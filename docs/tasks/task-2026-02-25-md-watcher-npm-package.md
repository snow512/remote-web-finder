# Task: MD Watcher — npm 패키지 분리
- **생성일:** 2026-02-25
- **우선순위:** 🟡 중간
- **브랜치:** `feature/docs-viewer`
- **상태:** 🔵 진행 중

---

## 목표

마크다운 뷰어/에디터를 독립 npm 패키지 `remote-web-finder`로 분리.
`npx remote-web-finder`로 어디서든 실행 가능하게 만들기.

---

## Phase 1: 패키지 구조 정비

- [x] `package.json` 재작성 (bin, files, metadata)
- [x] `server.js` CLI 개선 (shebang, --dir 기본값→cwd, --help, --version, --open)
- [x] `.gitignore` 생성
- [x] `.npmignore` 생성

## Phase 2: 문서 작성

- [x] `README.md` 작성
- [x] `LICENSE` (MIT) 생성

## Phase 3: 검증 & 배포 준비

- [x] `npm pack`으로 tarball 생성 → 내용 확인 (7파일, 21KB)
- [x] 임시 디렉토리에서 설치 후 테스트 (--help, --version, 서버 시작, API 정상)
- [ ] 사용자 확인 후 `npm publish` 실행

---

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `package.json` | 재작성 |
| `server.js` | shebang, CLI 개선 |
| `.gitignore` | 신규 생성 |
| `.npmignore` | 신규 생성 |
| `README.md` | 신규 생성 |
| `LICENSE` | 신규 생성 |

**프론트엔드 파일(public/)은 변경 없음**
