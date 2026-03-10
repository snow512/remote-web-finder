# 워크스페이스 운영 가이드

여러 워크스페이스(멀티 클론)를 효과적으로 운영하기 위한 가이드입니다.

---

## 워크스페이스란?

동일한 저장소를 여러 디렉토리에 **개별 클론**하여 병렬 작업하는 환경입니다.
각 클론은 완전히 독립된 `.git`을 가지므로 서로 간섭 없이 작업할 수 있습니다.

### git worktree와의 차이

| | 멀티 클론 (워크스페이스) | git worktree |
|---|---|---|
| `.git` | 각 클론마다 독립 | 하나의 `.git` 공유 |
| 동기화 | `git push/pull`로 원격 통해 | 로컬에서 즉시 공유 |
| 독립성 | 완전 독립 (다른 머신에서도 가능) | 같은 파일시스템 내 |
| 용량 | 클론마다 전체 히스토리 복사 | 히스토리 1카피 |
| 유연성 | 높음 (원격 서버, CI 등 범용) | 로컬 전용 |

---

## 워크스페이스 설정 절차

### 1. 저장소 클론

```bash
# 메인 워크스페이스 (이미 존재)
~/Workspace/my-project/

# 추가 워크스페이스 클론
git clone git@github.com:user/my-project.git ~/Workspace/my-project-second
git clone git@github.com:user/my-project.git ~/Workspace/my-project-third
```

### 2. 브랜치 체크아웃

각 워크스페이스에서 작업할 브랜치를 체크아웃합니다:

```bash
# second 워크스페이스
cd ~/Workspace/my-project-second
git checkout develop
git checkout -b feature/new-feature

# third 워크스페이스
cd ~/Workspace/my-project-third
git checkout develop
git checkout -b fix/bug-fix
```

### 3. 환경 분리

각 워크스페이스의 포트가 충돌하지 않도록 `.env.local`을 설정합니다:

```bash
# second 워크스페이스의 .env.local
PORT=5101
DB_PORT=5102
CORS_ORIGIN=http://localhost:5100
```

### 4. 진행 파일 생성

```bash
# docs/workspaces/ 에 워크스페이스 파일 생성 (한 워크스페이스에서만)
touch docs/workspaces/workspace-second.md
git add docs/workspaces/workspace-second.md
git commit -m "docs: add second workspace progress file"
git push
```

### 5. 의존성 설치

```bash
# 각 클론 디렉토리에서
npm install
```

---

## 운영 원칙

### 1. 소유권 규칙
- **자기 워크스페이스 파일만 수정한다** — 가장 중요한 규칙
- 다른 워크스페이스의 진행 파일은 읽기 전용으로 참고
- 충돌 최소화를 위해 각 워크스페이스는 서로 다른 영역을 작업

### 2. 동기화 규칙
- 다른 워크스페이스의 변경사항은 `git pull`로 수신
- 진행 파일 업데이트 후 `git push`하여 공유
- 머지 완료 후 다른 워크스페이스에서 develop pull 수행
- `develop` 브랜치를 통해 코드 변경사항 교환

### 3. 진행 파일 업데이트 시점
- 새 작업 시작 시
- 작업 완료 또는 단계 완료 시
- 브랜치 생성/전환/머지/삭제 시
- 하루 작업 종료 시

### 4. 브랜치 전략
- 각 워크스페이스는 독립된 feature 브랜치에서 작업
- 같은 feature 브랜치를 여러 워크스페이스에서 동시에 작업하지 않는다
- `develop`에 머지하기 전 다른 워크스페이스의 진행 상황을 확인
- 머지 후 다른 워크스페이스에서 `git pull origin develop`으로 싱크

### 5. 아카이브 관리
- 완료된 작업이 누적되면 진행 파일의 완료 항목을 아카이브
- `.archive/{YYYY-MM}/workspace-{name}-{date}.md`로 이동
- 진행 파일에는 현재 진행 중인 작업과 최근 완료만 유지

---

## 진행 파일 작성 요령

### 진행 중인 작업
- 체크박스 `- [ ]`로 표시
- 브랜치명을 괄호 안에 명시
- Phase별 진행 사항을 하위 항목으로 기록
- 완료된 Phase에 ✅ 표시

### 완료된 작업
- 체크박스 `- [x]`로 표시
- 머지 대상, 브랜치 삭제 여부 명시
- 관련 타스크 파일 링크

### 브랜치 현황
- 활성 브랜치: 이름과 용도 설명
- 머지 완료 브랜치: ~~취소선~~ 처리, 날짜 명시

---

## 트러블슈팅

### 포트 충돌
- `lsof -i :포트번호`로 점유 프로세스 확인
- 포트 체계에 따라 올바른 포트 범위 사용 확인

### 동기화 충돌
- 진행 파일 충돌 시: 자기 워크스페이스 파일만 본인 내용 유지
- 코드 충돌 시: develop 기준으로 리베이스 또는 머지

### 워크스페이스 정리
```bash
# 더 이상 필요 없는 워크스페이스 디렉토리 삭제
rm -rf ~/Workspace/my-project-second
```
