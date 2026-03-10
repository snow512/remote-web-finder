<!-- madang-ticket -->
티켓 관리 규칙은 `.madang/categories/tickets/`에 정의되어 있습니다 (groups.md, features.md, tasks.md). 문서는 `docs/groups/`, `docs/features/`, `docs/tasks/`에 저장됩니다.

### 워크플로우
- **계획모드 우선**: 큰 작업은 피쳐/타스크 문서를 먼저 생성한 뒤 구현을 시작한다.
- **Doing은 동시 3개 이하** (WIP 제한). Done 이동은 사용자 확인 후에만.

### 작성 기준
- 피쳐 = 하나의 사용자 가치. 타스크 = 하루 이내 완료 가능한 단위.
- 파일명: `feature-{YYYY-MM-DD}-{slug}.md`, `task-{YYYY-MM-DD}-{slug}.md`

### 타스크 자동 추적
개발 작업을 진행할 때 관련 타스크/피쳐 문서를 자동으로 업데이트한다:
- **작업 시작 시**: 관련 타스크의 status를 `In Progress`로 변경한다.
- **작업 완료 시**: 타스크의 status를 `Done`으로 변경하고, 체크리스트 항목을 `[x]`로 체크한다.
- **피쳐 상태 연동**: 피쳐의 모든 하위 타스크가 Done이면 피쳐도 `Done`으로, 하나라도 In Progress면 `In Progress`로 변경한다. 피쳐의 하위 타스크 테이블도 함께 업데이트한다.
- **매칭 방법**: 현재 작업 내용과 `docs/tasks/`의 타스크 제목/체크리스트를 매칭한다. 매칭되는 타스크가 없으면 추적하지 않는다.

> 피쳐/타스크를 새로 생성하거나, 칸반 그룹을 이동하거나, 계획모드로 작업을 설계할 때는 `.madang/categories/tickets/ticket-guide.md`를 먼저 읽으세요.
<!-- /madang-ticket -->