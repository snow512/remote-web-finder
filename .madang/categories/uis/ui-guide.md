# UI 디자인 가이드

일관되고 유지보수 가능한 UI를 설계하기 위한 가이드입니다.

---

## 인라인 스타일 금지 원칙

**React 코드에서 `style={{ }}` 인라인 스타일을 사용하지 않는다.**

인라인 스타일은 재사용이 불가능하고, hover/focus/media query 등 동적 상태를 처리할 수 없으며, 코드 중복을 야기한다. 반드시 아래 스타일링 전략을 따른다.

### 스타일링 전략: Styled Components + Tailwind CSS 조합

React 프로젝트에서는 **Styled Components**와 **Tailwind CSS**를 적절히 조합하여 사용한다.

1. **Tailwind CSS (우선 사용)** — 간단한 레이아웃, 간격, 색상, 타이포그래피 등 유틸리티 스타일
   ```tsx
   // ✅ Good — Tailwind 유틸리티 클래스
   <div className="flex items-center gap-2 p-4 rounded-lg bg-white shadow-sm">

   // ❌ Bad — 인라인 스타일
   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px' }}>
   ```

2. **Styled Components (복잡한 컴포넌트)** — 동적 스타일, 테마 연동, 컴포넌트 캡슐화가 필요한 경우
   ```tsx
   // ✅ Good — Styled Component
   const Card = styled.div<{ $active: boolean }>`
     background: ${({ theme }) => theme.colors.white};
     border: 2px solid ${({ $active }) => $active ? theme.colors.brand : 'transparent'};
     &:hover { box-shadow: ${({ theme }) => theme.shadows.md}; }
   `;

   // ❌ Bad — 인라인 스타일 + onMouseEnter 핸들러
   <div style={styles.card} onMouseEnter={e => { e.currentTarget.style.boxShadow = '...' }}>
   ```

3. **사용 기준**
   - **Tailwind** → 유틸리티성 스타일 (flex, padding, margin, font-size, color, rounded, shadow 등)
   - **Styled Components** → 컴포넌트 고유 스타일, 동적 props 기반 스타일, hover/focus/active 상태, 미디어 쿼리, 테마 토큰 참조
   - **인라인 스타일** → 런타임에 동적으로 계산되는 값만 허용 (예: `style={{ width: `${percent}%` }}`)

4. **금지 패턴**
   - `style={{ ...s.btn, ...s.btnPrimary }}` → 공통 컴포넌트 또는 Tailwind 클래스 사용
   - `style={localStylesObject}` → Styled Component 또는 Tailwind 클래스로 전환
   - `onMouseEnter`/`onMouseLeave`로 스타일 변경 → CSS `:hover` 사용 (Styled Components 또는 Tailwind `hover:`)

---

## UI 공통 컴포넌트화 지침

### 핵심 원칙

**모든 UI 컨트롤은 공통 컴포넌트로 만들고, 페이지에서는 공통 컴포넌트만 사용한다.**

페이지 코드에서 `<button>`, `<input>`, `<select>`, `<textarea>` 등 HTML 기본 요소를 직접 사용하지 않는다. 반드시 공통 컴포넌트(`Button`, `Input`, `Select`, `Textarea` 등)를 통해 사용한다.

### 공통 컴포넌트 목록

모든 공통 컴포넌트는 `client/src/components/common/` 디렉토리에 정의하고, `index.ts`에서 barrel export로 관리한다.

**UI Primitives (기본 컨트롤)**
| 컴포넌트 | 용도 | 핵심 Props |
|---------|------|-----------|
| `Button` | 모든 버튼 | variant, size, loading, disabled |
| `Input` | 텍스트 입력 | error, ref 지원 |
| `Select` | 드롭다운 선택 | options, placeholder |
| `Textarea` | 여러 줄 입력 | - |
| `Badge` | 상태/카테고리 레이블 | bg, color, onClick |
| `IconButton` | 아이콘 전용 버튼 | size, variant (ghost/outlined) |
| `ToggleButton` | 토글 필터 버튼 | active, activeStyle |
| `ProgressBar` | 진행률 표시 | segments, height, showLegend |
| `ReadonlyField` | 읽기 전용 값 표시 | value |

**Layout & Composition (레이아웃)**
| 컴포넌트 | 용도 |
|---------|------|
| `ButtonRow` | 버튼 그룹 래퍼 |
| `Tabs` | 탭 네비게이션 |
| `Modal` | 모달 다이얼로그 |
| `FormField` | 폼 필드 (레이블 + 컨트롤) |
| `PageHeader` | 페이지 제목 + 액션 버튼 |

**Data Display (데이터 표시)**
| 컴포넌트 | 용도 |
|---------|------|
| `StatusBadge` | 상태별 색상 자동 매핑 |
| `PriorityBadge` | 우선순위별 색상 자동 매핑 |
| `DataTable` | 정렬 가능한 데이터 테이블 |
| `CardGrid` | 카드 그리드 레이아웃 |
| `ActionButton` | 행 액션 버튼 (soft variant) |

**Filters & Search (필터/검색)**
| 컴포넌트 | 용도 |
|---------|------|
| `SearchInput` | 검색 입력 |
| `FilterSelect` | 필터 드롭다운 |
| `FilterBar` | 검색 + 필터 + 뷰 토글 바 |
| `FilteredEmptyState` | 필터 결과 없음 상태 |
| `ViewToggle` | 리스트/카드 뷰 전환 |

**Modals (모달)**
| 컴포넌트 | 용도 |
|---------|------|
| `ConfirmModal` | 확인/취소 다이얼로그 |
| `CreateDocModal` | 문서 생성 모달 |
| `RelationPicker` | 관계 문서 선택 |

### 작업 규칙

1. **새 UI가 필요하면 공통 컴포넌트를 먼저 만든다** — 페이지에 직접 정의하지 않는다
2. **비슷한 UI가 2번 이상 나타나면 즉시 공통 컴포넌트로 추출한다**
3. **기존 인라인 스타일 코드를 발견하면 공통 컴포넌트로 교체한다**
4. **공통 컴포넌트 수정 시 기존 사용처에 영향이 없는지 확인한다**
5. **barrel export (`index.ts`)를 카테고리별로 정리하여 관리한다**

---

## 색상 관리

1. **색상 팔레트를 정의하고 재사용한다** — `docs/ui/styles/style-colors.md`에 팔레트를 정의
2. **RGB/HEX 값을 코드에 직접 사용하지 않는다** — 반드시 디자인 토큰(변수명)으로 참조
3. **의미 기반 색상 이름을 사용한다** — `--color-primary`, `--color-danger` (O) / `--color-blue`, `--color-red` (X)
4. **다크모드를 고려한 색상 체계** — 밝기 대비가 아닌 의미 기반으로 설계

## 타이포그래피

1. **폰트 크기 체계를 정의한다** — 임의의 px 값을 사용하지 않고 정의된 단계를 사용
2. **행간(line-height)과 자간(letter-spacing)도 함께 정의** — 폰트 크기만 정하면 불일치 발생
3. **최대 3~4단계의 제목 크기** — 과도한 크기 변화는 시각적 혼란 유발

## 간격(Spacing)

1. **4px 또는 8px 기반 간격 체계를 사용** — 일관된 시각적 리듬 유지
2. **간격도 토큰으로 정의** — `--spacing-sm`, `--spacing-md`, `--spacing-lg`
3. **매직 넘버 금지** — `margin: 13px` 같은 임의 값 사용 금지

## 와이어프레임 작성

1. **페이지 단위로 작성** — 하나의 와이어프레임 = 하나의 페이지/화면
2. **ASCII 또는 설명적 레이아웃** — 도구 의존 없이 텍스트로 표현
3. **인터랙션을 함께 기술** — 레이아웃만이 아닌 사용자 동작과 반응도 포함
4. **반응형 고려사항 명시** — 모바일/태블릿/데스크톱 차이점 기록

## 컴포넌트 설계

1. **프레임워크에 종속되지 않는 명세** — React/Vue 등 특정 문법 없이 작성
2. **변형(Variants)과 상태(States)를 반드시 정의** — default, hover, disabled, error 등
3. **입력(Props)을 명확히 정의** — 이름, 타입, 필수 여부, 설명
4. **사용법 섹션 포함** — 이 컴포넌트를 언제, 어디서 사용하는지

## 접근성(Accessibility)

1. **색상만으로 정보를 전달하지 않는다** — 아이콘, 텍스트 레이블 병행
2. **키보드 네비게이션을 고려** — 모든 인터랙티브 요소는 키보드로 접근 가능
3. **충분한 색상 대비** — WCAG 2.1 AA 기준 (4.5:1) 이상

---

## 확장 가이드 (Extension Guides)

특정 플랫폼이나 개발 환경에 대한 세부 규칙은 확장 가이드에서 관리한다.
확장 가이드는 이 문서의 원칙을 기반으로 플랫폼별 구체적인 수치와 패턴을 제공한다.

| 확장 가이드 | 설명 |
|------------|------|
| [모바일 확장 가이드](ui-mobile-guide.md) | 모바일(≤640px) 환경의 터치 타겟, 레이아웃 압축, 바텀시트, 데이터 테이블 전략 |

> 새로운 플랫폼(태블릿, 다크모드, RTL 등)에 대한 가이드가 필요하면 `ui-{platform}-guide.md`로 추가한다.
