<!-- madang-ui -->
UI 디자인 규칙은 `.madang/categories/uis/ui.md`에 정의되어 있습니다. UI 문서는 `docs/ui/`(wireframes, styles, components)에 저장됩니다.

### 필수 원칙
1. **공통 컴포넌트 우선** — 페이지를 만들기 전에 `docs/ui/components/`에서 재사용 가능한 컴포넌트를 먼저 확인한다.
2. **디자인 토큰 사용** — 색상, 간격, 폰트 크기에 매직넘버를 쓰지 않는다. 의미 기반 변수명(`--color-primary`, `--spacing-md`)을 사용한다.
3. **비슷한 UI가 2번 이상 나타나면 컴포넌트로 추출**한다.

> UI 컴포넌트를 설계하거나, 와이어프레임을 작성하거나, 스타일 토큰을 정의할 때는 `.madang/categories/uis/ui-guide.md`를 먼저 읽으세요.
<!-- /madang-ui -->