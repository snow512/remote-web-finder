# Task 관리 규칙

이 폴더는 **Remote Web Finder** 프로젝트의 작업을 관리합니다.

---

## 📁 폴더 구조

```
docs/tasks/
├── tasks.md                  ← 이 파일 (규칙만)
├── todos.md                  ← 기능 개선 TODO 목록
├── task-{날짜}-{요약}.md     ← 개별 작업 파일
└── .completed/               ← 완료된 작업 아카이브
    └── 2026-01/              ← 년월별 분리 폴더
        └── task-{날짜}-{요약}.md
```

---

## 📌 상태 범례

**우선순위:** `🔴 높음` `🟡 중간` `🟢 낮음`

---

## 📝 관리 규칙

1. **새 작업 추가:** `task-{날짜}-{요약}.md` 파일 생성
2. **작업 완료 시:** `.completed/` 폴더로 이동
3. **파일명 형식:** `task-{YYYY-MM-DD}-{요약}.md` (예: `task-2026-02-28-add-search.md`)
4. **파일 내용:** 담당, 우선순위, 상태, 체크리스트 포함
5. **기능 개선 작업 시:** [`todos.md`](todos.md)에서 항목을 선택하고, 착수 시 task 파일 생성 후 todos.md에 링크 추가
6. **작업 완료 후:** todos.md의 해당 항목을 `[x]`로 체크하고, task 파일을 `.completed/`로 이동
7. **Phase 작성 시:** 각 Phase는 **2~3가지 항목**으로 구성. 한 Phase가 커지면 여러 Phase로 분할

---

## 🔗 연관 문서

- 기능 개선 TODO: [`todos.md`](todos.md)
- 이슈 관리: [`/docs/issues/issues.md`](../issues/issues.md)

---

**마지막 업데이트:** 2026-02-28
