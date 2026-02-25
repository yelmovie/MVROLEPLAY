import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Admin client: 계정 생성/조회/인증 검증용 (service role key)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Auth client: 일반 로그인용 (anon key) — signInWithPassword는 반드시 anon key 사용
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YWdsa2F5c2Vrd3pzZGlqY2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMTcxNTcsImV4cCI6MjA4MTY5MzE1N30._RpqY_-YTHiNOmdNsLxZHsqZ3vvueXN7J1wE010HBoE';
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? 'https://ptaglkaysekwzsdijcci.supabase.co',
  SUPABASE_ANON_KEY,
);

// Create test account on startup
async function createTestAccount() {
  try {
    console.log('Checking if test account exists...');
    
    // Try to get the test user
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users?.users?.find((u: any) => u.email === 'teacher@test.com');
    
    if (!testUser) {
      console.log('Creating test account: teacher@test.com');
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'teacher@test.com',
        password: 'test1234',
        user_metadata: { name: '테스트 선생님' },
        email_confirm: true
      });

      if (error) {
        console.log(`Failed to create test account: ${error.message}`);
      } else {
        console.log('Test account created successfully!');
      }
    } else {
      console.log('Test account already exists');
    }
  } catch (error) {
    console.log(`Error checking/creating test account: ${error}`);
  }
}

// Create test account on startup
createTestAccount();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9b937296/health", (c) => {
  return c.json({ status: "ok" });
});

// 이메일 형식 검사 (간단)
function isValidEmail(s: string): boolean {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()) && s.length <= 256;
}

// Sign up endpoint
app.post("/make-server-9b937296/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "이메일, 비밀번호, 이름을 모두 입력해주세요." }, 400);
    }
    if (!isValidEmail(String(email).trim())) {
      return c.json({ error: "올바른 이메일 형식이 아닙니다." }, 400);
    }
    if (String(password).length < 6) {
      return c.json({ error: "비밀번호는 6자 이상이어야 합니다." }, 400);
    }
    if (String(name).trim().length > 100) {
      return c.json({ error: "이름은 100자 이내로 입력해주세요." }, 400);
    }

    const trimmedEmail = String(email).trim();
    const trimmedName = String(name).trim().slice(0, 100);
    // Automatically confirm the user's email since an email server hasn't been configured.
    const { data, error } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password: String(password),
      user_metadata: { name: trimmedName },
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    console.log(`User created successfully: ${email}`);
    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup server error: ${error}`);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

// Login endpoint
app.post("/make-server-9b937296/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "이메일과 비밀번호를 입력해주세요." }, 400);
    }
    if (!isValidEmail(String(email).trim())) {
      return c.json({ error: "올바른 이메일 형식이 아닙니다." }, 400);
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: String(email).trim(), password: String(password) });

    if (error) {
      // If user doesn't exist, auto-create (for test account flow)
      if (error.message.includes('Invalid login credentials')) {
        return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
      }
      console.log(`Login error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    console.log(`User logged in successfully: ${email}`);
    return c.json({
      user: {
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
      },
      accessToken: data.session.access_token,
    });
  } catch (error) {
    console.log(`Login server error: ${error}`);
    return c.json({ error: "Internal server error during login" }, 500);
  }
});

// Generate topic with OpenAI GPT-4o-mini API
app.post("/make-server-9b937296/generate-topic", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.log(`Authentication error while generating topic: ${authError?.message || 'No user ID'}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { subject, gradeLevel } = await c.req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.log('OpenAI API key not found in environment variables');
      return c.json({ error: 'API key not configured' }, 500);
    }

    // 과목별 주제 가이드
    const topicGuideMap: Record<string, string> = {
      '국어': '국어 연극 대본 주제 — 실제 아이들이 겪는 말하기/듣기/읽기/쓰기와 연관된 생생한 사건. 예: "발표 시간에 말문이 막힌 아이", "일기장을 몰래 읽은 친구", "거짓말이 들통난 독후감 사건"',
      '사회': '사회 역할극 주제 — 민주주의/인권/경제/공동체 개념을 갈등 상황으로 체험. 예: "학급 회의에서 다수결의 함정", "외국인 친구가 겪은 차별", "마을 공원 개발 찬반 주민 갈등"',
      '도덕': '도덕 역할극 주제 — 도덕적 딜레마 상황에서 올바른 가치를 스스로 깨닫는 이야기. 예: "친구의 시험 부정행위를 목격했을 때", "따돌림 현장에서 방관자가 된 순간", "용기가 필요한 고백의 순간"',
      '역사': '역사극 주제 — 특정 역사적 시대/사건을 그 시대 인물 시각으로 체험. 예: "3·1운동 전날 밤 학생들의 결의", "조선시대 신분제 속 천민의 꿈", "6·25 피란민 가족의 이별"',
      '영어': '영어 역할극 주제 — 핵심 영어 표현을 실생활 상황에서 자연스럽게 반복 사용. 예: "길을 잃은 외국인을 도와주기(길 안내 표현)", "학교 매점 물건 사기(쇼핑 표현)", "새 친구에게 자기소개하기"',
    };
    const subjectTopicGuide = topicGuideMap[subject] || '해당 과목에 맞는 역할극 주제';

    // Create prompt for topic generation
    const prompt = '당신은 초등학교 교육 연극 전문가입니다.\n\n' +
      subjectTopicGuide + '\n\n' +
      '위 가이드에 맞는 역할극 수업 주제를 1개만 생성해주세요:\n' +
      '- 학년: ' + gradeLevel + '\n\n' +
      '주제 기준:\n' +
      '1. 아이들이 흥미 있어하고 재미있어할 만한 소재 (우정, 미션, 오해, 비밀, 챌린지, 유머 등)\n' +
      '2. 해당 과목의 학습 목표가 이야기 속에서 자연스럽게 달성되는 상황\n' +
      '3. 현실적인 학교·일상 경험에 가깝고, 억지 설정 없이 자연스럽게 전개 가능한 사건\n' +
      '4. ' + gradeLevel + ' 학생 수준에 맞고, 20-30자 내외의 생생하고 끌리는 제목\n\n' +
      'JSON 형식으로 응답해주세요:\n' +
      '{\n  "topic": "생성된 주제"\n}';

    console.log(`Calling OpenAI GPT-4o-mini API to generate topic for user ${user.id}`);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 초등학교 교사를 위한 교육 콘텐츠 생성 전문가입니다. 항상 JSON 형식으로 응답합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 200,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`OpenAI API error: ${response.status} - ${errorText}`);
      return c.json({ error: `API request failed: ${response.status}` }, 500);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response
    let topicData;
    try {
      topicData = JSON.parse(content);
    } catch (parseError) {
      console.log(`JSON parsing error: ${parseError}. Raw content: ${content}`);
      return c.json({ error: 'Failed to parse API response' }, 500);
    }

    console.log(`Topic generated successfully for user ${user.id}: ${topicData.topic}`);
    return c.json({ topic: topicData.topic });

  } catch (error) {
    console.log(`Generate topic server error: ${error}`);
    return c.json({ error: `Internal server error while generating topic: ${error}` }, 500);
  }
});

// Generate script with OpenAI GPT-4o-mini API
app.post("/make-server-9b937296/generate-script", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.log(`Authentication error while generating script: ${authError?.message || 'No user ID'}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.log('OpenAI API key not found in environment variables');
      return c.json({ error: 'API key not configured' }, 500);
    }

    // 요금 폭탄 방지: 서버에서 시간·인원·주제 길이 상한 강제
    formData.timeMinutes = Math.min(20, Math.max(3, Number(formData.timeMinutes) || 5));
    // AUTHORITATIVE_COUNT: characterCount only; groupSize ignored for character count
    formData.characterCount = Math.min(30, Math.max(1, Number(formData.characterCount) || 5));
    formData.groupSize = formData.groupSize ?? 5;
    const topicStr = (formData.topic ?? '').toString().trim();
    if (topicStr.length > 500) {
      formData.topic = topicStr.slice(0, 500);
    }

    // Log the request details
    console.log(`Generating script for user ${user.id}:`, {
      subject: formData.subject,
      topic: formData.topic,
      gradeLevel: formData.gradeLevel,
      groupSize: formData.groupSize,
      timeMinutes: formData.timeMinutes,
      characterCount: formData.characterCount
    });

    // Create prompt for OpenAI API
    // 1분당 평균 대사 15줄, 각 대사 평균 80자 기준 → A4 5~6장 목표
    const minDialogueCount = Math.max(formData.timeMinutes * 15, 40);
    const expectedDialogueLength = formData.timeMinutes * 900;
    const a4Pages = Math.round(formData.timeMinutes / 4); // 4분 = 1장 기준
    const isEnglish = formData.subject === '영어';
    const characterCount = formData.characterCount;

    // 커스텀 역할명 목록 — 본문에는 넣지 않고, (1)(2)(3)만 사용. 추천 이름은 교사용 참고 섹션으로만 전달
    const customChars: Array<{ number: number; name: string }> = formData.customCharacters || [];
    const recommendedNamesForTeacher = customChars.length > 0
      ? customChars.map((c: { number: number; name: string }) => c.name)
      : undefined;

    // 역할극 품질고정: 대본 본문·대사·캐릭터에는 반드시 (1), (2), (3) ... (N)만 사용. 실제 이름(민준 등)은 본문에 금지
    const charListText = characterCount + '명 — 대본 내 표기는 반드시 (1), (2), (3) … (' + characterCount + ')만 사용';
    const nameSlotRule =
      '★★★ 이름칸 강제 ★★★\n' +
      '- 등장인물·대사·상황 설명 전체에서 인물 표기는 반드시 (1), (2), (3), … (' + characterCount + ')만 사용.\n' +
      '- 실제 이름(민준, 서연, 등장인물 1 등)은 대본 본문·dialogue·situationAndRole·characters.name에 넣지 말 것.\n' +
      '- characters 배열: name은 "(1)", "(2)", "(3)" … 형식만 사용. description만 성격/역할 설명.';
    const optionLines = [
      formData.includeDiscussionLeader ? '- 토론 진행자 역할 포함' : '',
      formData.includeStudentTeacherLayout ? '- 교사.학생 역할 구분 포함' : '',
      formData.includeAchievementStandards ? '- 교육과정 성취기준 포함' : '',
    ].filter(Boolean).join('\n');

    const coreK = Math.min(6, characterCount); // Core Speakers K (default 6, if N<6 then K=N)

    // 공통 JSON 응답 형식 — v3: slot/speakerSlot 필수(전원발화 검증용), Cast Tag(Core/Supporting), 5장면
    const jsonBlock =
      '{\n' +
      '  "title": "역할극 제목 (주제와 정확히 일치)",\n' +
      '  "situationAndRole": "1) 수업 목표 2문장 + 2) 상황 설정(3~4문장) + Scene Mode 1줄. 인물 (1),(2),…로 표기.",\n' +
      '  "characters": [{"slot": 1, "name": "(1)", "description": "역할/목표 1문장/말투 힌트 3~6단어/Tag(Core 또는 Supporting)"}],\n' +
      '  "dialogue": [{"speakerSlot": 1, "character": "📍장면 또는 (1)", "line": "장면제목 또는 대사(반드시 (이름칸): 로 시작)"}],\n' +
      '  "teachingPoints": ["교사용 지도 포인트 질문형 3~5개"],\n' +
      '  "teacherTips": ["장면별 한 줄 지도 팁 5개"],\n' +
      '  "achievementStandards": {"subject": "' + formData.subject + '", "standard": "' + formData.gradeLevel + ' 초등 성취기준"},\n' +
      '  "closingQuestions": ["마무리 질문 3개"],\n' +
      '  "evaluationRubric": {"이해": ["수준1","수준2","수준3"], "참여": ["수준1","수준2","수준3"], "표현": ["수준1","수준2","수준3"]}\n' +
      '}\n' +
      '※ characters는 반드시 slot 1~' + characterCount + ' 각각 1개씩. dialogue의 각 항목은 반드시 speakerSlot(1~' + characterCount + ') 포함. 장면 라벨은 speakerSlot 생략 가능하나 대사는 speakerSlot 필수.';

    // ─── ROLEPLAY SCRIPT GENERATOR - REALISTIC + CURRICULUM + ENGLISH-ONLY MODE v3 ───
    const QUALITY_SYSTEM_HEADER =
      '[ROLEPLAY SCRIPT GENERATOR - REALISTIC + CURRICULUM + ENGLISH-ONLY MODE v3]\n\n' +
      '당신은 초등/중등 수업용 역할극 대본 생성기다. 사용자 입력(과목/학년/주제/학습목표/핵심키워드/배경/등장인물 수)을 최우선으로 따른다. ' +
      '절대 조건: "현실에서 있을 법한 상황" + "학습목표 달성" + "연기 가능한 대사".\n\n' +
      '========================\n0) 입력값 해석\n========================\n' +
      '- 등장인물 수 = N (1~30). 반드시 정확히 N명으로 출력한다. 현재 N = ' + characterCount + '.\n' +
      '- 모든 인물 이름은 확정하지 않는다. 반드시 (   ) 빈칸으로 출력한다. JSON에서는 (1),(2),…(' + characterCount + ')로 식별.\n' +
      '- 배경은 사용자가 지정하면 그대로, 미지정이면 주제에 가장 현실적인 배경 1개 선택. "교실"은 자동 기본값이 아니다.\n\n' +
      '========================\n1) 언어 모드(Language Mode)\n========================\n' +
      '- 과목이 "영어(English)"이면: 출력 전체를 영어로만 작성하라. (대사/설명/키워드 뜻/지도 포인트/평가/검수까지 전부 영어. 한국어/번역/괄호 병기 금지.)\n' +
      '- 영어 과목이 아니면: 한국어로 작성하라.\n\n' +
      '========================\n2) 장면 유형(Scene Mode) 자동 선택 (주제/목표에 맞는 1개만)\n========================\n' +
      'A. Debate/Discussion(입장 비교+근거) B. Problem-Solving(문제→원인→대안→선택→실행) C. Persuasion/Negotiation(요구-조건-타협-합의)\n' +
      'D. Inquiry/Investigation(질문-가설-자료-해석-결론) E. Values/Dilemma(가치 충돌-선택 이유-배려-공동 규칙)\n' +
      '※ 선택한 Scene Mode를 "상황 설정"에 1줄로 명시하라.\n\n' +
      '========================\n3) 말도 안 되는 내용 차단(금지)\n========================\n' +
      '- 주제 밖 설정/캐릭터/장르 전환 금지. 초현실/판타지/뜬금 개그 금지(마법, 외계인, 좀비, 시간여행, 게임아이템 등).\n' +
      '- 현대 밈/메타표현 금지(레트로, 망상, 현타, 밈, ㅋㅋ, SNS드립 등). 과도한 폭력/공포/성적/혐오 금지.\n' +
      '- 역사/사회/과학은 교과서 수준 일반적 사실만, 검증 불가 단정·음모·비난 금지.\n\n' +
      '========================\n4) 등장인물 설계(핵심 발화자 + 전원 발화)\n========================\n' +
      '- "핵심 발화자(Core Speakers)" K명 지정. (기본 K=6, N<6이면 K=N). 현재 K = ' + coreK + '. 나머지는 "Supporting Speakers".\n' +
      '- 전원 발화: 대본 전체에서 N명 모두 최소 1회 이상 발화. (누락=실패)\n' +
      '- 핵심 발화자: 각자 최소 2회 이상 발화. 지원 발화자: 각자 최소 1회 발화(짧은 1~2문장 허용).\n' +
      '- 역할은 Scene Mode에 맞게 기능 배치. \'학생/교사\'는 배경이 "교실"로 명시된 경우에만 포함. 교실이 아니면 자동 생성하지 마라.\n\n' +
      '========================\n5) 출력 형식(고정) + 빈 페이지/빈 섹션 방지\n========================\n' +
      '1) Learning Goals(또는 수업 목표) 2문장 2) Situation Setup(또는 상황 설정) 3~4문장+Scene Mode 1줄\n' +
      '3) Cast(N명 정확히): (   )/Role/Goal(1문장)/Speaking style hint(3~6단어)/Tag(Core or Supporting)\n' +
      '4) Script 5장면: 각 장면 배경 1문장+대사 6~10줄, 모든 대사 "(이름칸):" 로 시작, N명 전원 발화(게이트 체크)\n' +
      '5) Teacher Notes(또는 교사용 지도 포인트) 질문형 3~5개 6) Quick Assessment(3항목×3수준) 7) Quality Gate: [ ]N명 정확히 [ ]Core K명 각 ≥2회 발화 [ ]전원 1회 이상 발화 [ ]금지요소 0 [ ]빈 섹션/과도 줄바꿈 없음 → 통과본만 출력\n\n' +
      '========================\n6) 실패 시 재작성\n========================\n' +
      'Quality Gate에서 하나라도 실패하면, 설명 없이 전면 재작성하여 최종본만 출력하라.\n';

    // 5장면: 배경 1문장+대사 6~10줄, (1): (2): 로 시작, 전원 발화
    const actLabelRule =
      '대본은 5장면 구조. character="📍장면", line에 장면 제목. 각 장면: 배경 1문장+대사 6~10줄. 모든 대사 "(1):", "(2):" 등 (이름칸): 로 시작. Core 발화자 각 ≥2회, Supporting 각 ≥1회. N명 전원 최소 1회 발화(필수). teacherTips 장면별 5개.';

    // 공통 대사 규칙 (분량 + 재미·자연스러움)
    const perCharMin = Math.floor(minDialogueCount / characterCount);
    const dialogueRules =
      '★★★ 대사 분량 준수 — A4 ' + a4Pages + '장 이상 ★★★\n' +
      '- 공연 시간 ' + formData.timeMinutes + '분 → 실제 대사 최소 ' + minDialogueCount + '개 이상 (막 레이블 제외)\n' +
      '- 총 대사 글자 수: 최소 ' + expectedDialogueLength + '자 이상\n' +
      '- 각 대사 2~4문장 이상 (단답 1문장 대사 금지), 한 대사 최소 80자 이상\n' +
      '- 등장인물 ' + characterCount + '명 균등 배분: 인물당 최소 ' + perCharMin + '대사 이상\n\n' +
      '★★★ 내용·톤 — 지루·형식적이지 않게 ★★★\n' +
      '- 현실적인 상황에서 억지 설정 없이 자연스럽게 전개. 아이들이 좋아할 소재(우정, 미션, 오해, 비밀, 챌린지, 유머) 활용\n' +
      '- 감정 지문 활용: (울먹이며), (화나서), (용기를 내서), (신나서) 등으로 생동감 있게\n' +
      '- 아이들 실제 말투: 존댓말·반말 캐릭터별 일관, 짧은 반박/단문은 전체 20% 이하\n' +
      '- 인물 간 주고받는 대화 충분히 — 독백 연속 3개 이상 금지. 교훈을 대사로 설명하지 말고 행동·감정·결과로만 표현\n' +
      '- 캐릭터 설명은 구체적으로 (예: "소심한 친구" 대신 "앞에만 서면 말을 잘 못하는 친구"). "전문가 학생", "소매이 대형" 같은 어색한 표현 금지';

    // INPUT_DATA: 권위 JSON (재해석 금지), CONSTRAINTS: 모델이 반드시 따를 조건
    const inputDataObj = {
      subject: formData.subject,
      gradeLevel: formData.gradeLevel,
      topic: formData.topic,
      characterCount: formData.characterCount,
      timeMinutes: formData.timeMinutes,
      topicGeneratedByAI: formData.topicGeneratedByAI,
      includeDiscussionLeader: formData.includeDiscussionLeader,
      includeStudentTeacherLayout: formData.includeStudentTeacherLayout,
      includeAchievementStandards: formData.includeAchievementStandards,
    };
    const inputDataJson = JSON.stringify(inputDataObj, null, 2);
    const inputDataAndConstraints =
      'INPUT_DATA (do not reinterpret; treat as authoritative JSON):\n' + inputDataJson + '\n\n' +
      'CONSTRAINTS:\n' +
      '- Use characterCount EXACTLY.\n' +
      '- No fantasy, no memes, no meta jokes, no surreal elements.\n' +
      '- All sections must be non-empty; no excessive blank lines.\n\n' +
      'OPTIONS INTERPRETATION (MUST FOLLOW):\n' +
      '- includeStudentTeacherLayout = true  → classroom layout allowed (teacher/student roles allowed).\n' +
      '- includeStudentTeacherLayout = false → classroom layout forbidden. Do NOT include teacher/student unless the topic explicitly says "교실/수업/학급/학생" etc.\n' +
      '- includeDiscussionLeader = true  → include ONE facilitator role (neutral moderator), not a teacher by default.\n' +
      '- includeDiscussionLeader = false → no facilitator role unless the topic requires it.\n\n' +
      'AUTHORITATIVE_COUNT:\n' +
      '- characterCount is the ONLY source of truth for number of characters.\n' +
      '- groupSize must be ignored.\n\n' +
      'IF learningGoal / background are NOT provided:\n' +
      '- Derive them ONLY from the topic using school-appropriate, realistic wording.\n' +
      '- Do NOT invent unrelated subplots or characters.\n\n' +
      'LANGUAGE RULE:\n' +
      '- If subject == "영어": output ALL content in English only. No Korean. No bilingual parentheses.\n' +
      '- Else: output in Korean.\n\n' +
      'SPEAKING RULES:\n' +
      '- Every character must speak at least once in the whole script.\n' +
      '- Choose Core Speakers (default 6; if characterCount < 6, then all are core).\n' +
      '- Each Core Speaker speaks at least 2 times.\n' +
      '- Supporting Speakers may speak 1 short line (1–2 sentences).\n\n' +
      'STRUCTURE RULE:\n' +
      '- Keep 5 scenes, but use "round-robin" in scenes 2–4 to ensure all supporting speakers speak once.\n' +
      '- Avoid long monologues. Keep each line short and actionable.\n\n' +
      'FORMATTING RULE:\n' +
      '- Do not output multiple blank lines. Never output more than 1 blank line in a row.\n' +
      '- Every section must contain content.\n\n' +
      'JSON IDENTIFIERS (required for validation):\n' +
      '- characters: each object MUST have "slot" (number 1 to N). Exactly N characters with slot 1,2,…,N.\n' +
      '- dialogue: each speech line MUST have "speakerSlot" (number 1 to N). Scene/location lines may omit speakerSlot. All N speakerSlots must appear at least once.\n\n' +
      '---\n\n';

    // 과목별 프롬프트와 시스템 메시지 구성
    let prompt = '';
    let systemContent = '';

    if (formData.subject === '국어') {
      systemContent = QUALITY_SYSTEM_HEADER +
        '당신은 초등학교 국어과 교육연극 전문 극작가입니다.\n' +
        '아이들이 흥미 있어하는 이야기 속에서 말하기·듣기·읽기·쓰기 역량이 자연스럽게 드러나도록 대본을 씁니다.\n' +
        '대본은 A4 ' + a4Pages + '장 이상, 각 대사 2~4문장 이상. 항상 유효한 JSON으로 응답합니다.';
      prompt =
        inputDataAndConstraints +
        '초등학교 국어과 교육 연극 대본을 작성해주세요.\n\n' +
        '[주제 고정 — 반드시 준수]\n' +
        '- 주제: ' + formData.topic + '\n' +
        '- 위 주제만 유지하고, 주제와 무관한 뜬금 전개·소재(외계인/마법/현대SNS/밈 등)를 넣지 마세요.\n\n' +
        '[국어 역할극 핵심]\n' +
        '- 말하기·듣기·읽기·쓰기가 이야기 속에서 자연스럽게 달성되도록 구성. 실제 아이들 학교·일상.\n\n' +
        '[대본 조건]\n' +
        '- 과목: 국어 / 학년: ' + formData.gradeLevel + ' / 공연: ' + formData.timeMinutes + '분, 대사 최소 ' + minDialogueCount + '개\n' +
        '- 등장인물: 정확히 ' + characterCount + '명\n' +
        optionLines + '\n\n' +
        '[이름칸 강제]\n' + nameSlotRule + '\n\n' +
        '[장면/막]\n' + actLabelRule + '\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로만 응답하세요:\n' + jsonBlock;

    } else if (formData.subject === '사회') {
      systemContent = QUALITY_SYSTEM_HEADER +
        '당신은 초등학교 사회과 교육연극 전문 극작가입니다.\n' +
        '민주주의·인권·경제·공동체 등이 갈등·미션 속에서 체험되도록 대본을 씁니다. 대본 A4 ' + a4Pages + '장 이상. 유효한 JSON만 응답.';
      prompt =
        inputDataAndConstraints +
        '초등학교 사회과 교육 연극 대본을 작성해주세요.\n\n' +
        '[주제 고정]\n' +
        '- 주제: ' + formData.topic + ' — 이 주제만 유지. 무관한 뜬금 전개 금지.\n\n' +
        '[대본 조건]\n' +
        '- 과목: 사회 / 학년: ' + formData.gradeLevel + ' / 등장인물: ' + characterCount + '명 / 대사 최소 ' + minDialogueCount + '개\n' +
        optionLines + '\n\n' +
        '[이름칸 강제]\n' + nameSlotRule + '\n\n' +
        '[장면/막]\n' + actLabelRule + '\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로만 응답:\n' + jsonBlock;

    } else if (formData.subject === '도덕') {
      systemContent = QUALITY_SYSTEM_HEADER +
        '당신은 초등학교 도덕과 교육연극 전문 극작가입니다. 도덕적 가치가 딜레마·이야기 속에서 드러나도록. 대본 A4 ' + a4Pages + '장 이상. 유효한 JSON만 응답.';
      prompt =
        inputDataAndConstraints +
        '초등학교 도덕과 교육 연극 대본을 작성해주세요.\n\n' +
        '[주제 고정]\n' +
        '- 주제: ' + formData.topic + ' — 이 주제만 유지. 무관한 뜬금 전개 금지.\n\n' +
        '[대본 조건]\n' +
        '- 과목: 도덕 / 학년: ' + formData.gradeLevel + ' / 등장인물: ' + characterCount + '명 / 대사 최소 ' + minDialogueCount + '개\n' +
        optionLines + '\n\n' +
        '[이름칸 강제]\n' + nameSlotRule + '\n\n' +
        '[장면/막]\n' + actLabelRule + '\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로만 응답:\n' + jsonBlock;

    } else if (formData.subject === '역사') {
      systemContent = QUALITY_SYSTEM_HEADER +
        '당신은 초등학교 역사과 교육연극 전문 극작가입니다. 그 시대 인물 시각으로 경험. 대본 A4 ' + a4Pages + '장 이상. 유효한 JSON만 응답.';
      prompt =
        inputDataAndConstraints +
        '초등학교 역사과 교육 연극 대본을 작성해주세요.\n\n' +
        '[주제 고정]\n' +
        '- 주제: ' + formData.topic + ' — 이 주제만 유지. 무관한 뜬금 전개 금지.\n\n' +
        '[대본 조건]\n' +
        '- 과목: 역사 / 학년: ' + formData.gradeLevel + ' / 등장인물: ' + characterCount + '명 / 대사 최소 ' + minDialogueCount + '개\n' +
        optionLines + '\n\n' +
        '[이름칸 강제]\n' + nameSlotRule + '\n\n' +
        '[장면/막]\n' + actLabelRule + '\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로만 응답:\n' + jsonBlock;

    } else {
      // 영어 — v3: ENGLISH-ONLY MODE (출력 전체 영어, 한국어/번역/괄호 병기 금지)
      const engNameSlotRule =
        '★★★ NAME SLOT ONLY ★★★ Use ONLY "(1)", "(2)", … "(' + characterCount + ')" for speakers. No real names.';
      systemContent = QUALITY_SYSTEM_HEADER +
        'LANGUAGE MODE: Subject is English. Output EVERYTHING in English only: title, situationAndRole, characters.description, dialogue.line, teachingPoints, teacherTips, closingQuestions, evaluationRubric. No Korean. No translation. No parenthetical Korean. Valid JSON only.';
      const engJsonBlock =
        '{\n' +
        '  "title": "Play title in English (match topic exactly)",\n' +
        '  "situationAndRole": "Learning goals 2 sentences + Situation 3~4 sentences + Scene Mode 1 line. All in English. Characters (1),(2),…",\n' +
        '  "characters": [{"slot": 1, "name": "(1)", "description": "Role/Goal/Speaking style/Tag(Core or Supporting) in English"}],\n' +
        '  "dialogue": [{"speakerSlot": 1, "character": "📍Scene or (1)", "line": "English dialogue or [Scene] label"}],\n' +
        '  "teachingPoints": ["Question prompts in English"], "teacherTips": ["In English"],\n' +
        '  "achievementStandards": {"subject": "영어", "standard": "' + formData.gradeLevel + ' 초등 영어 성취기준"},\n' +
        '  "closingQuestions": ["In English"], "evaluationRubric": {"이해": ["L1","L2","L3"], "참여": ["L1","L2","L3"], "표현": ["L1","L2","L3"]}\n' +
        '}\n' +
        'Required: characters must have slot 1~' + characterCount + ' each. Each dialogue line that is speech (not scene label) must have speakerSlot 1~' + characterCount + '.';
      prompt =
        inputDataAndConstraints +
        'Write an elementary English drama script. Topic: ' + formData.topic + '. Output 100% in English (no Korean). Core Speakers K=' + coreK + ', each ≥2 lines; all ' + characterCount + ' characters speak at least once.\n\n' +
        '[NAME SLOT]\n' + engNameSlotRule + '\n\n' +
        '[CONDITIONS]\n' +
        '- Topic: ' + formData.topic + ' / Grade: ' + formData.gradeLevel + ' / Characters: exactly ' + characterCount + ' / Min ' + minDialogueCount + ' dialogue lines\n' +
        '[DIALOGUE]\n' +
        'Min ' + expectedDialogueLength + ' chars total. Every line in English. Use (1),(2),… only for speakers. All ' + characterCount + ' must speak at least once.\n\n' +
        'Respond with this JSON only (all content in English):\n' + engJsonBlock;
    }

    // 금지 패턴: REALISTIC & CURRICULUM SAFE 2) 금지 규칙 (교실/학생·교사는 배경 지정 시에만 허용되므로 검증에서 제외)
    const FORBIDDEN_PATTERNS = [
      '외계인', 'UFO', '마법', '마법사', '인스타', 'SNS', '밈', '멈춤', '타임슬립', '로봇', 'AI챗봇',
      '유튜브 밈', '게임 아이템', '게임아이템', '레트로', '망상', '현타', '초능력', '좀비', '시간여행', '갑툭튀'
    ];
    const REQUIRED_SECTIONS = ['title', 'situationAndRole', 'characters', 'dialogue', 'teachingPoints', 'closingQuestions'];

    // includeStudentTeacherLayout === false 일 때 교실/학생·교사 강제 차단용
    const CLASSROOM_TERMS = ['학생', '교사', '선생님', '교실', '수업', '발표', '모둠', '학급', '반장', '담임'];
    function containsAny(text: string, terms: string[]): boolean {
      const t = (text ?? '').toString();
      return terms.some((term) => t.includes(term));
    }

    function validateScriptQuality(script: Record<string, unknown>, charCount: number, formDataIn: { includeStudentTeacherLayout?: boolean; topic?: string }): { ok: boolean; reason?: string } {
      const fullText = [script.title, script.situationAndRole, JSON.stringify(script.dialogue)].filter(Boolean).join(' ');

      for (const p of FORBIDDEN_PATTERNS) {
        if (fullText.includes(p)) return { ok: false, reason: '금지 패턴 포함: ' + p };
      }

      // 학생/교사 자동 등장 강제 차단: includeStudentTeacherLayout === false 이면 교실 프레이밍 금지
      if (formDataIn.includeStudentTeacherLayout === false) {
        const chars = script.characters as Array<{ name?: string; description?: string }> | undefined;
        const charText = (chars ?? []).map((c) => `${c?.name ?? ''} ${c?.description ?? ''}`).join('\n');
        const dialogue = script.dialogue as Array<{ character?: string; line?: string }> | undefined;
        const dialogueText = (dialogue ?? []).map((d) => d?.line ?? '').join('\n');
        const joined = [script.title, script.situationAndRole, charText, dialogueText].filter(Boolean).join('\n');
        if (containsAny(joined, CLASSROOM_TERMS)) {
          return { ok: false, reason: 'includeStudentTeacherLayout=false인데 교실/학생·교사 관련 용어 포함(학생·교사 자동 등장 금지)' };
        }
      }
      for (const key of REQUIRED_SECTIONS) {
        if (!script[key] || (Array.isArray(script[key]) && (script[key] as unknown[]).length === 0)) {
          return { ok: false, reason: '섹션 누락: ' + key };
        }
      }

      // 4) topic–script 일치성: 주제 핵심어 2개 이상이 본문에 등장해야 통과
      const topicStr = (formDataIn.topic ?? '').toString().trim();
      if (topicStr.length >= 2) {
        const stop = new Set(['에서', '의', '을', '를', '은', '는', '이', '가', '과', '와', '및', '함정', '관련', '에', '다', '로', '으로', '하다', '있다']);
        const topicTokens = topicStr
          .split(/\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 2 && !stop.has(s))
          .slice(0, 6);
        const dialogueArr = script.dialogue as Array<{ character?: string; line?: string }> | undefined;
        const bodyText = [script.title, script.situationAndRole, ...(dialogueArr ?? []).map((d) => (d?.line ?? '').toString())].filter(Boolean).join('\n');
        const hits = topicTokens.filter((tok) => bodyText.includes(tok)).length;
        if (topicTokens.length >= 3 && hits < 2) {
          return { ok: false, reason: `Topic alignment too low. topic tokens: ${topicTokens.join(',')}, hits in script: ${hits}` };
        }
      }

      const chars = script.characters as Array<{ slot?: number; name?: string; description?: string }> | undefined;
      if (!chars || chars.length !== charCount) return { ok: false, reason: '등장인물 수 불일치' };
      const placeholderRe = /^\(\d+\)$/;
      const namesOk = chars.every((c) => typeof c.name === 'string' && placeholderRe.test(String(c.name).trim()));
      if (!namesOk) return { ok: false, reason: '등장인물 이름이 (1),(2),(3) 형식이 아님' };

      // slot 기반: 1..N 각각 정확히 1개씩 존재
      const N = charCount;
      const slots = new Set<number>((chars ?? []).map((c) => c.slot).filter((s) => typeof s === 'number' && s >= 1 && s <= N));
      if (slots.size !== N) return { ok: false, reason: `characters slot count mismatch: expected slots 1..${N}, got ${slots.size} unique slots` };
      for (let i = 1; i <= N; i++) {
        if (!slots.has(i)) return { ok: false, reason: `characters missing slot ${i}` };
      }

      // speakerSlot 기반 전원 발화: N명 모두 dialogue에서 speakerSlot으로 최소 1회 발화
      const dialogue = script.dialogue as Array<{ speakerSlot?: number; character?: string; line?: string }> | undefined;
      const spoke = new Set<number>();
      if (dialogue && dialogue.length > 0) {
        for (const item of dialogue) {
          if (typeof item.speakerSlot === 'number' && item.speakerSlot >= 1 && item.speakerSlot <= N) {
            spoke.add(item.speakerSlot);
          }
        }
      }
      if (spoke.size !== N) {
        return { ok: false, reason: `Not all characters spoke. speakerSlot 1..${N} required; only ${spoke.size} spoke. Missing: ${Array.from({ length: N }, (_, i) => i + 1).filter((s) => !spoke.has(s)).join(', ')}` };
      }
      return { ok: true };
    }

    const maxAttempts = 3;
    let scriptData: Record<string, unknown> | null = null;
    let lastContent: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Calling OpenAI (attempt ${attempt}/${maxAttempts}) for user ${user.id}, subject: ${formData.subject}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + openaiApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: prompt + (attempt > 1 ? '\n\n[이전 응답이 품질 검증에 실패했습니다. 위 규칙을 정확히 지키고 다시 생성해주세요.]' : '') }
          ],
          temperature: 0.88,
          max_tokens: 16000,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`OpenAI API error: ${response.status} - ${errorText}`);
        return c.json({ error: `API request failed: ${response.status}` }, 500);
      }

      const data = await response.json();
      lastContent = data.choices[0]?.message?.content ?? null;
      if (!lastContent) {
        return c.json({ error: 'Empty API response' }, 500);
      }

      try {
        scriptData = JSON.parse(lastContent) as Record<string, unknown>;
      } catch (parseError) {
        console.log(`JSON parse error (attempt ${attempt}): ${parseError}`);
        if (attempt === maxAttempts) return c.json({ error: 'Failed to parse API response' }, 500);
        continue;
      }

      const validation = validateScriptQuality(scriptData, characterCount, formData);
      if (validation.ok) break;
      console.warn(`Script validation failed (attempt ${attempt}): ${validation.reason}`);
      if (attempt === maxAttempts) {
        return c.json({ error: '대본 품질 검증 실패. 다시 시도해 주세요. (' + (validation.reason || '') + ')' }, 422);
      }
    }

    if (!scriptData) return c.json({ error: 'Failed to generate script' }, 500);

    // 교사용 참고: 추천 이름 목록은 본문에 넣지 않고, 응답에만 별도 필드로
    if (recommendedNamesForTeacher && recommendedNamesForTeacher.length > 0) {
      scriptData.recommendedNamesForTeacher = recommendedNamesForTeacher;
    }

    console.log(`Script generated successfully for user ${user.id}: ${scriptData.title}`);
    return c.json({ script: scriptData });

  } catch (error) {
    console.log(`Generate script server error: ${error}`);
    return c.json({ error: `Internal server error while generating script: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);