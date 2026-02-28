# 📋 프로젝트 요약정보

이 파일은 프로젝트의 요약 정보를 관리한다.
세부 내역은 `docs/specs/` 폴더의 개별 문서에서 확인할 수 있다.

---

## 프로젝트 개요

- **이름:** Remote Web Finder (rwf)
- **설명:** Local markdown document viewer and editor with live preview
- **타입:** Node.js CLI 도구 + 웹 서버
- **저장소:** https://github.com/snow512/remote-web-finder

---

## 기술 스택

| 영역 | 선택 | 비고 |
|------|------|------|
| Runtime | Node.js (>=16) | |
| Server | Express 4 | |
| Test | Jest + Supertest | |
| Client | Vanilla HTML/CSS/JS | `public/` 폴더 |

---

## 실행 방법

### CLI (글로벌 설치)
```bash
npm install -g .          # 글로벌 설치
rwf                       # 기본 실행 (포트 5999)
rwf -p 6999               # 포트 지정
rwf -d /path/to/docs      # 디렉토리 지정
rwf --open                # 브라우저 자동 열기
rwf -b                    # 백그라운드 실행
rwf --shutdown            # 서버 종료
```

### 개발 모드
```bash
npm start                 # 서버 실행 (포트 5999)
npm test                  # 테스트 실행
```

### CLI 옵션
| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-d, --dir <path>` | 서빙할 디렉토리 | `.` (현재 디렉토리) |
| `-p, --port <number>` | 포트 번호 | `5999` |
| `--ignore <file>` | 커스텀 ignore 파일 | `.rwfignore` |
| `--open` | 브라우저 자동 열기 | off |
| `-b, --bg` | 백그라운드 데몬 모드 | off |
| `--shutdown` | 동일 포트의 기존 서버 종료 | - |
| `-h, --help` | 도움말 | - |
| `-v, --version` | 버전 표시 | - |

---

## 포트 체계

| 용도 | 포트 | 비고 |
|------|------|------|
| 기본 포트 | **5999** | `-p` 옵션으로 변경 가능 |

---

## 주요 파일 구조

```
remote-web-finder/
├── server.js             → Express 서버 메인 파일 (CLI 엔트리포인트)
├── server.test.js        → 테스트 파일
├── package.json          → bin: rwf, remote-web-finder
├── public/               → 정적 파일 (클라이언트)
├── .rwfignore            → 파일 제외 규칙
├── docs/                 → 문서 📚
│   ├── project.md        → 이 파일 (프로젝트 요약)
│   ├── specs/            → 설계 문서
│   ├── tasks/            → 작업 관리
│   ├── issues/           → 이슈 추적
│   └── decisions.md      → 기술 결정사항
├── CLAUDE.md             → Claude 작업 관리 (진입점)
└── project-init.md       → 프로젝트 초기화 지침
```

---

## 현재 개발 단계

현재 개발 중인 아이템은 `docs/tasks/` 안의 파일들을 보고 파악한다.
