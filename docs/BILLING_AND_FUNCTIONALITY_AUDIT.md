# 요금·기능 점검 보고서

## 1. 요금 폭탄 / 과금 위험 점검

### 1.1 OpenAI API (Edge Function)

| 항목 | 현황 | 조치 |
|------|------|------|
| **모델** | `gpt-4o-mini` (상대적으로 저렴) | 유지 |
| **generate-topic** | 1회당 `max_tokens: 200` | 적정 |
| **generate-script** | 1회당 `max_tokens: 16000` | 상한만 서버에서 강제(아래 참고) |
| **인증** | 스크립트/주제 생성 모두 로그인 필수 | 유지 |
| **입력 검증** | 없음 → 위험 | ✅ **서버에서 timeMinutes(3~20), characterCount(1~30) 강제 적용** |

**적용한 방어:**
- `generate-script` 요청 시 서버에서 `timeMinutes`, `characterCount`를 클램핑해 비정상적으로 큰 요청으로 토큰이 폭증하는 것을 방지했습니다.

### 1.2 남은 위험과 권장 사항

| 위험 | 설명 | 권장 조치 |
|------|------|------------|
| **사용자당 무제한 호출** | 동일 사용자가 짧은 시간에 대본/주제를 수십 번 요청 가능 | Supabase 대시보드에서 Edge Function 호출량 모니터링. 필요 시 Redis/KV로 사용자당 분당·시간당 호출 제한 추가 |
| **OpenAI 사용량** | API 키 유출·악용 시 과금 | [OpenAI Usage](https://platform.openai.com/usage)에서 월 예산 알림 설정 권장 |
| **Supabase Edge Function** | 무료/유료 한도 초과 가능 | [Supabase Billing](https://supabase.com/dashboard/project/_/settings/billing)에서 사용량·알림 확인 |
| **createTestAccount** | 콜드스타트마다 `listUsers()` 호출 | 테스트 계정이 이미 있으면 스킵하므로 부담 적음. 필요 시 주기적 크론으로만 실행하도록 변경 가능 |

### 1.3 비용 감각 (참고)

- **gpt-4o-mini**: 대본 1회 생성(예: 5분·5명) 시 출력 수천 토큰 가정 시 1회당 소량 비용 수준.
- **과금 폭탄**은 주로 (1) 악의적/무한 반복 호출, (2) 토큰 상한 없는 대량 입력일 때 발생.  
  → 현재는 **인증 + 서버 측 상한**으로 어느 정도 완화된 상태.

---

## 2. 기능·버튼 점검

### 2.1 버튼별 동작

| 화면 | 버튼 | 동작 | 비고 |
|------|------|------|------|
| **Home** | 로그인/로그아웃 | ✅ `onLogin` / `onLogout` | |
| **Home** | 대본 만들기 시작 / 과목 선택하러 가기 | ✅ `onSubjectSelect` (비로그인 시 로그인 모달) | |
| **Home** | 모바일 메뉴 토글 | ✅ `setMobileMenuOpen` | |
| **SubjectSelect** | 뒤로 가기 | ✅ `onBack` | |
| **SubjectSelect** | 과목 카드 선택 | ✅ `setSelectedSubject` | |
| **SubjectSelect** | 다음 단계로 | ✅ `onNext(selectedSubject)` (선택 시에만 활성화) | |
| **AuthModal** | 닫기 (X, 배경) | ✅ `onClose` | |
| **AuthModal** | 로그인/회원가입 제출 | ✅ `handleSubmit` → `onLogin` | |
| **AuthModal** | 회원가입/로그인 전환 | ✅ `setIsLogin` | |
| **AuthModal** | 테스트 계정 자동 입력 | ✅ `fillTestAccount` | |
| **ScriptForm** | 뒤로 가기 / 로그아웃 | ✅ `onBack` / `onLogout` | |
| **ScriptForm** | AI 주제 생성 | ✅ `handleGenerateTopic` (로딩 중 `disabled`) | |
| **ScriptForm** | 추천 주제 클릭 | ✅ `handleTopicClick` | |
| **ScriptForm** | 기본 설정 / 역할 설정 탭 | ✅ 탭 전환 | |
| **ScriptForm** | 이름 프리셋 / 초기화 / 역할 추가·삭제·수정 | ✅ 각 핸들러 연결 | |
| **ScriptForm** | AI 대본 생성하기 | ✅ `handleSubmit` (유효하지 않거나 로딩 중 `disabled`) | |
| **ScriptResult** | 수정하기 / 로그아웃 / 새로 만들기 | ✅ `onBack` / `onLogout` / `onNewScript` | |
| **ScriptResult** | DOCX 다운로드 / PDF 다운로드 | ✅ 각 핸들러, **로딩 중 비활성화 및 문구 변경** | |
| **ScriptResult** | 아코디언 섹션 토글 | ✅ `toggleSection` | |

### 2.2 수정한 오류·개선 사항

| 구분 | 내용 |
|------|------|
| **에러 응답 파싱** | `!response.ok`일 때 `response.json()`이 실패(502/503 HTML 등)하면 앱이 깨지지 않도록 try/catch 후 일반 메시지 표시. (주제 생성·대본 생성 모두) |
| **다운로드 중복 클릭** | PDF/DOCX 다운로드 중 버튼 비활성화 + "생성 중..." 표시로 중복 실행 방지. |

---

## 3. 실행 오류 가능성 점검

| 항목 | 확인 내용 |
|------|-----------|
| **로그인 실패** | Edge Function에서 anon key로 `signInWithPassword` 호출. 테스트 계정 생성 로직 있음. |
| **대본 생성 401** | 로그인 필수, `Authorization: Bearer` 전달 필요. 클라이언트에서 `user.accessToken` 사용 중. |
| **다운로드 실패** | `downloadScriptAsPDF` / `downloadScriptAsDOCX` try/catch + toast로 사용자에게 안내. |
| **formData 누락** | 대본 생성 시 `topic`, `subject` 등 필수. 폼에서 주제 필수 검사(`isFormValid`) 있음. |

---

## 4. 요약

- **요금 방지:** 서버에서 `timeMinutes`(3~20), `characterCount`(1~30) 강제. 추가로 사용량 모니터링·OpenAI 예산 알림 권장.
- **기능:** 주요 버튼·플로우는 모두 연결되어 있으며, 대본/주제 생성 시 에러 응답 파싱과 다운로드 버튼 로딩 처리를 보강했습니다.
