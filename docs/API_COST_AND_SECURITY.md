# API 요금폭탄 방지 및 보안 설계

## 0. 로그인 401 해결 (Edge Function JWT 설정)

- **원인**: Supabase Edge Function 기본값이 `verify_jwt: true`라서, 토큰 없이 호출하는 `/login`, `/signup` 요청이 게이트웨이에서 401로 차단됨.
- **조치**: `supabase/config.toml`에 `[functions.make-server-9b937296]` + `verify_jwt = false` 설정 추가함. `/login`, `/signup`은 함수 내부에서 이메일·비밀번호로 검증하고, `generate-topic`/`generate-script`는 요청 헤더의 `Authorization`으로 검증함.
- **배포**: 설정 반영을 위해 Edge Function을 한 번 다시 배포해야 함.  
  `cd MVROLEPLAY` 후  
  `supabase functions deploy make-server-9b937296`

## 1. API 요금폭탄 방지 (현재 적용)

| 항목 | 적용 내용 |
|------|-----------|
| **인증** | 대본/주제 생성 API는 로그인 필수. 미인증 시 401. |
| **timeMinutes** | 서버에서 3~20 분으로 클램핑. |
| **characterCount** | 서버에서 1~30 명으로 클램핑. |
| **topic 길이** | 서버에서 최대 500자로 자르기. (초과 입력 시 토큰 폭증 방지) |
| **max_tokens** | `generate-topic`: 200, `generate-script`: 16000 고정. |
| **모델** | `gpt-4o-mini` (상대적으로 저렴). |

## 2. 권장 추가 조치 (요금폭탄)

| 조치 | 설명 |
|------|------|
| **사용자당 호출 제한** | 동일 사용자(또는 IP)당 분당/시간당/일당 최대 호출 수 제한. (예: Redis/KV 또는 Supabase DB로 카운트) |
| **OpenAI 예산 알림** | [OpenAI Usage](https://platform.openai.com/usage)에서 월 예산 알림 설정. |
| **Edge Function 모니터링** | Supabase 대시보드에서 호출 횟수·실패율 확인. |

## 3. 보안 점검 요약 (재점검)

| 항목 | 현황 |
|------|------|
| **비밀키** | OPENAI_API_KEY, SERVICE_ROLE_KEY는 서버만 사용, 클라이언트 노출 없음. |
| **Anon Key** | 클라이언트용으로 공개 가능. 저장소에 있으면 프로젝트별로 운영 키 확인. |
| **로그인/회원가입** | 이메일 형식, 비밀번호 6자 이상, 이름 100자 검증. |
| **대본 생성 입력** | timeMinutes, characterCount, topic 길이 서버 검증. |
| **XSS** | PDF/DOCX 생성 시 AI·사용자 입력은 escape 후 사용. (downloadPDF.ts) |
| **CORS** | `origin: "*"`. 배포 시 특정 도메인만 허용 권장. |
| **Rate limiting** | 미구현. 악의적 반복 호출 시 비용 증가 가능 → 위 2. 참고. |

## 4. 기능·버튼 점검 (최종)

| 화면 | 버튼/동작 | 연결 |
|------|-----------|------|
| Home | 로그인/로그아웃, 대본 만들기 시작, 과목 선택하러 가기, 모바일 메뉴 | ✅ |
| SubjectSelect | 뒤로가기, 과목 선택, 다음 단계 | ✅ |
| AuthModal | 닫기, 로그인/회원가입 제출, 전환, 테스트 계정 자동 입력 | ✅ |
| ScriptForm | 뒤로가기, 로그아웃, AI 주제 생성, 추천 주제 클릭, 기본/역할 설정 탭, 추가 옵션 토글, AI 대본 생성하기 | ✅ |
| ScriptResult | 수정하기, 로그아웃, 새로 만들기, 학생 이름 예/아니오, DOCX/PDF 다운로드, 아코디언 섹션 토글 | ✅ |

핵심용어(keyTerms) 기능은 제거됨. 대본 JSON에는 keyTerms 필드 없음.

## 5. 최종 점검 요약 (보안·요금·안정성·기능)

| 구분 | 항목 | 상태 |
|------|------|------|
| **보안** | API 키는 서버만 사용, 클라이언트에 비밀 노출 없음 | ✅ |
| | 로그인/회원가입 이메일·비밀번호·이름 검증 | ✅ |
| | 대본 생성 시 accessToken 필수, 401/422/504 처리 | ✅ |
| | PDF 생성 시 escapeHtml로 XSS 방지 | ✅ |
| **요금** | timeMinutes 3~20, characterCount 1~30, topic 500자 서버 클램핑 | ✅ |
| | max_tokens 고정, gpt-4o-mini 사용 | ✅ |
| **안정성** | 권장 구간(15명·10분 이하) 검증 완화·2회 시도 | ✅ |
| | 발화 인원 speakerSlot + character "(1)" 폴백 집계 | ✅ |
| | 클라이언트 대본 생성 3분 타임아웃, 에러 메시지 정리 | ✅ |
| **기능** | 로그인/회원가입/대본·주제 생성/DOCX·PDF 다운로드/역할 설정 등 동작 | ✅ |
