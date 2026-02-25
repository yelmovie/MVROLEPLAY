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

// Sign up endpoint
app.post("/make-server-9b937296/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    // Automatically confirm the user's email since an email server hasn't been configured.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
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
      return c.json({ error: "Email and password are required" }, 400);
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

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

    // 요금 폭탄 방지: 서버에서 시간·인원 상한 강제
    formData.timeMinutes = Math.min(20, Math.max(3, Number(formData.timeMinutes) || 5));
    formData.characterCount = Math.min(30, Math.max(1, Number(formData.characterCount) || Number(formData.groupSize) || 5));
    formData.groupSize = formData.groupSize ?? 5;

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

    // 커스텀 역할명 목록
    const customChars: Array<{ number: number; name: string }> = formData.customCharacters || [];
    const charListText = customChars.length > 0
      ? customChars.map((c: { number: number; name: string }) => c.number + '번. ' + c.name).join(', ')
      : characterCount + '명 (자유롭게 이름 설정)';
    const charNamesForPrompt: string | null = customChars.length > 0
      ? customChars.map((c: { number: number; name: string }) => '"' + c.number + '. ' + c.name + '"').join(', ')
      : null;

    // 공통 조건 텍스트
    const charNameHint = charNamesForPrompt ? '지정된 번호.이름 그대로' : '인물명';
    const charInstruction = charNamesForPrompt
      ? '등장인물 이름 반드시 사용: ' + charNamesForPrompt + ' (번호.이름 형식 그대로)'
      : '';
    const optionLines = [
      formData.includeDiscussionLeader ? '- 토론 진행자 역할 포함' : '',
      formData.includeStudentTeacherLayout ? '- 교사.학생 역할 구분 포함' : '',
      formData.includeAchievementStandards ? '- 교육과정 성취기준 포함' : '',
    ].filter(Boolean).join('\n');

    // 공통 JSON 응답 형식 (문자열 연결)
    const jsonBlock =
      '{\n' +
      '  "title": "역할극 제목",\n' +
      '  "situationAndRole": "배경과 상황 설명 (200자 이상). ' +
      '반드시 포함: 이 역할극은 ' + formData.timeMinutes + '분 동안 ' + formData.groupSize + '명의 학생이 ' +
      characterCount + '명의 등장인물을 연기합니다. 등장인물: ' + charListText + '",\n' +
      '  "keyTerms": [{"term": "핵심 개념/용어", "definition": "뜻과 이야기 속 쓰임새 설명"}],\n' +
      '  "characters": [{"name": "' + charNameHint + '", "description": "성격.역할.감정적 여정 (50자 이상)"}],\n' +
      '  "dialogue": [{"character": "인물명 또는 📍장면", "line": "대사 또는 [막 레이블] 장면 지문"}],\n' +
      '  "teachingPoints": ["교육 목표와의 연결 (100자 이상, 5개 이상)"],\n' +
      '  "teacherTips": ["연극 지도 팁 (80자 이상, 4개 이상)"],\n' +
      '  "achievementStandards": {"subject": "' + formData.subject + '", "standard": "' + formData.gradeLevel + ' 초등 교육과정 성취기준 (정확한 코드와 내용)"},\n' +
      '  "closingQuestions": ["성찰 질문 (50자 이상, 3개 이상)"]\n' +
      '}';

    // 4막 레이블 규칙 (유연 적용 — 억지 구조 금지)
    const actLabelRule =
      '장면 전환 시에만 character="📍장면", line에 막 레이블을 넣으세요. 억지로 4막을 맞추지 말고, 이야기 흐름이 자연스럽게 이어지도록 하세요.\n' +
      '  예: "[도입 - 발단]", "[전개 - 갈등 심화]", "[절정 - 위기]", "[결말 - 해소와 성찰]" — 필요 시 3막·5막 등으로 조정 가능';

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

    // 과목별 프롬프트와 시스템 메시지 구성
    let prompt = '';
    let systemContent = '';

    if (formData.subject === '국어') {
      systemContent =
        '당신은 초등학교 국어과 교육연극 전문 극작가입니다.\n' +
        '아이들이 흥미 있어하는 이야기 속에서 말하기·듣기·읽기·쓰기 역량이 자연스럽게 드러나도록 대본을 씁니다.\n' +
        '발단-전개-위기-절정-결말을 억지로 맞추지 않고, 현실적 상황과 자연스러운 전개·재미를 우선합니다.\n' +
        '대본은 A4 ' + a4Pages + '장 이상, 각 대사 2~4문장 이상. 항상 유효한 JSON으로 응답합니다.';
      prompt =
        '초등학교 국어과 교육 연극 대본을 작성해주세요.\n\n' +
        '[국어 역할극 핵심]\n' +
        '- 목표: 재미있는 역할극을 하면서 말하기·듣기·읽기·쓰기 학습 목표가 자연스럽게 달성되도록 구성\n' +
        '- 실제 아이들이 겪을 법한 학교·일상 이야기. 억지 설정 없이 자연스러운 전개. 발단-전개-위기-절정-결말 구조는 필수가 아님\n' +
        '- 예: 말 한마디 오해, 발표 연습, 일기·편지로 마음 전하기, 토론·설득 등이 이야기 속에 자연스럽게 녹아들게\n' +
        '- 지루하거나 형식적인 대사 금지. 아이들이 몰입하고 웃고 공감할 수 있는 대사와 상황\n\n' +
        '[대본 조건]\n' +
        '- 과목: 국어 / 주제: ' + formData.topic + ' / 학년: ' + formData.gradeLevel + '\n' +
        '- 공연: ' + formData.groupSize + '명, ' + formData.timeMinutes + '분 → 대사 최소 ' + minDialogueCount + '개, 총 ' + expectedDialogueLength + '자 이상\n' +
        '- 등장인물: 정확히 ' + characterCount + '명\n' +
        (charInstruction ? '- ' + charInstruction + '\n' : '') +
        optionLines + '\n\n' +
        '[장면/막]\n' + actLabelRule + '\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로 응답해주세요:\n' + jsonBlock;

    } else if (formData.subject === '사회') {
      systemContent =
        '당신은 초등학교 사회과 교육연극 전문 극작가입니다.\n' +
        '민주주의·인권·경제·공동체 등 사회 개념이 재미있는 갈등·미션·일상 속에서 자연스럽게 체험되도록 대본을 씁니다.\n' +
        '억지 구조나 개념 설명 대사 없이, 이야기 흐름과 아이들이 좋아할 소재를 우선합니다.\n' +
        '대본은 A4 ' + a4Pages + '장 이상, 각 대사 2~4문장 이상. 항상 유효한 JSON으로 응답합니다.';
      prompt =
        '초등학교 사회과 교육 연극 대본을 작성해주세요.\n\n' +
        '[사회 역할극 핵심]\n' +
        '- 목표: 재미있는 역할극을 하면서 사회 학습 목표(민주주의·인권·경제·공동체·지역사회·법 등)가 자연스럽게 달성되도록 구성\n' +
        '- 추상적 개념을 대사로 설명하지 말고, 실제 사건·갈등·선택 속에서 체험으로 이해되게. 현실적인 상황, 억지 설정 금지\n' +
        '- 인물들은 각자 이해 가능한 이유로 행동(선/악 구도 금지). 아이들이 몰입할 수 있는 소재와 자연스러운 전개\n\n' +
        '[대본 조건]\n' +
        '- 과목: 사회 / 주제: ' + formData.topic + ' / 학년: ' + formData.gradeLevel + '\n' +
        '- 공연: ' + formData.groupSize + '명, ' + formData.timeMinutes + '분 → 대사 최소 ' + minDialogueCount + '개, 총 ' + expectedDialogueLength + '자 이상\n' +
        '- 등장인물: 정확히 ' + characterCount + '명\n' +
        (charInstruction ? '- ' + charInstruction + '\n' : '') +
        optionLines + '\n\n' +
        '[장면/막]\n' + actLabelRule + '\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로 응답해주세요:\n' + jsonBlock;

    } else if (formData.subject === '도덕') {
      systemContent =
        '당신은 초등학교 도덕과 교육연극 전문 극작가입니다.\n' +
        '도덕적 가치(정직·배려·용기·공감 등)가 재미있는 딜레마·이야기 속에서 자연스럽게 드러나도록 대본을 씁니다.\n' +
        '교훈을 대사로 설명하지 않고, 인물의 선택과 결과로만 전달합니다. 억지 구조 금지.\n' +
        '대본은 A4 ' + a4Pages + '장 이상, 각 대사 2~4문장 이상. 항상 유효한 JSON으로 응답합니다.';
      prompt =
        '초등학교 도덕과 교육 연극 대본을 작성해주세요.\n\n' +
        '[도덕 역할극 핵심]\n' +
        '- 목표: 재미있는 역할극을 하면서 도덕 학습 목표가 자연스럽게 달성되도록 구성. 정직·배려·용기·공감·책임·우정 등이 갈등 속에서 시험받고 깨달아지게\n' +
        '- 인물은 쉬운 선택과 어려운 선택 사이에서 이해 가능한 이유로 갈등. 선/악 구도 금지. 교훈을 대사로 말하지 말고 행동·결과로만 표현\n' +
        '- 현실적인 학교·일상 상황, 억지 설정 없이 자연스러운 전개. 아이들이 공감하고 좋아할 소재\n\n' +
        '[대본 조건]\n' +
        '- 과목: 도덕 / 주제: ' + formData.topic + ' / 학년: ' + formData.gradeLevel + '\n' +
        '- 공연: ' + formData.groupSize + '명, ' + formData.timeMinutes + '분 → 대사 최소 ' + minDialogueCount + '개, 총 ' + expectedDialogueLength + '자 이상\n' +
        '- 등장인물: 정확히 ' + characterCount + '명\n' +
        (charInstruction ? '- ' + charInstruction + '\n' : '') +
        optionLines + '\n\n' +
        '[장면/막]\n' + actLabelRule + '\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로 응답해주세요:\n' + jsonBlock;

    } else if (formData.subject === '역사') {
      systemContent =
        '당신은 초등학교 역사과 교육연극 전문 극작가입니다.\n' +
        '역사적 시대·사건을 그 시대 인물 시각으로 몰입감 있게 경험하는, 아이들이 좋아할 만한 이야기를 씁니다.\n' +
        '역사적 사실에 맞추되, 억지 구조 없이 자연스럽고 흥미진진한 전개를 우선합니다.\n' +
        '대본은 A4 ' + a4Pages + '장 이상, 각 대사 2~4문장 이상. 항상 유효한 JSON으로 응답합니다.';
      prompt =
        '초등학교 역사과 교육 연극 대본을 작성해주세요.\n\n' +
        '[역사 역할극 핵심]\n' +
        '- 목표: 재미있는 역할극을 하면서 역사 학습 목표가 자연스럽게 달성되도록 구성. 그 시대 인물들의 눈으로 사건을 경험\n' +
        '- 역사적 사실·시대 배경은 정확히, 말투·분위기는 시대감 있게. 하지만 지루한 설명 대사 금지. 인물의 감정·선택·갈등이 중심\n' +
        '- 아이들이 몰입할 수 있는 소재와 전개. 억지 설정 없이 자연스러운 이야기 흐름\n\n' +
        '[대본 조건]\n' +
        '- 과목: 역사 / 주제: ' + formData.topic + ' / 학년: ' + formData.gradeLevel + '\n' +
        '- 공연: ' + formData.groupSize + '명, ' + formData.timeMinutes + '분 → 대사 최소 ' + minDialogueCount + '개, 총 ' + expectedDialogueLength + '자 이상\n' +
        '- 등장인물: 정확히 ' + characterCount + '명\n' +
        (charInstruction ? '- ' + charInstruction + '\n' : '') +
        optionLines + '\n\n' +
        '[장면/막]\n' + actLabelRule + '\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로 응답해주세요:\n' + jsonBlock;

    } else {
      // 영어
      systemContent =
        'You are an elementary school English drama specialist.\n' +
        'You write FUN, engaging scripts where TARGET English expressions appear NATURALLY and REPEATEDLY so students learn by using them in context.\n' +
        'Avoid boring or formulaic situations (e.g. dull "finding the library" Q&A). Use kid-friendly, realistic situations with natural flow and a bit of humor or surprise.\n' +
        'Each dialogue line 2~4 sentences minimum. A4 ' + a4Pages + '+ pages. Always respond in valid JSON.';
      const engJsonBlock =
        '{\n' +
        '  "title": "Engaging English play title",\n' +
        '  "situationAndRole": "Vivid scene description in Korean (200+ chars). Include: ' +
        '이 역할극은 ' + formData.timeMinutes + '분 동안 ' + formData.groupSize + '명의 학생이 ' +
        characterCount + '명의 등장인물을 연기합니다. 등장인물: ' + charListText + '",\n' +
        '  "keyTerms": [{"term": "Target English expression", "definition": "Korean meaning + example"}],\n' +
        '  "characters": [{"name": "' + (charNamesForPrompt ? 'exact name as listed' : 'Character name') + '", "description": "Personality and role in Korean (50+ chars)"}],\n' +
        '  "dialogue": [{"character": "Name OR \\u{1F4CD}장면", "line": "English dialogue OR [Act Label] Korean stage direction"}],\n' +
        '  "teachingPoints": ["How this scene practices target expression (100+ chars, 5+ points, Korean)"],\n' +
        '  "teacherTips": ["English drama coaching tips (80+ chars, 4+ tips, Korean)"],\n' +
        '  "achievementStandards": {"subject": "영어", "standard": "' + formData.gradeLevel + ' 초등 영어 교육과정 성취기준 (정확한 코드와 내용)"},\n' +
        '  "closingQuestions": ["Reflection question in Korean (50+ chars, 3+ questions)"]\n' +
        '}';
      prompt =
        'Write an elementary school English drama script that is FUN and engaging, not boring or formulaic.\n\n' +
        '[ENGLISH ROLEPLAY CORE]\n' +
        '- Goal: Students learn KEY English expressions by performing an interesting story. Target expressions for "' + formData.topic + '" must appear NATURALLY 8–12+ times in different contexts\n' +
        '- Use realistic, kid-friendly situations (friendship, mission, misunderstanding, secret, challenge, humor). No forced or dull setups\n' +
        '- Natural flow: characters react to each other; avoid repetitive Q&A patterns. Include emotion and variety\n\n' +
        '[SCRIPT CONDITIONS]\n' +
        '- Topic: ' + formData.topic + ' / Grade: ' + formData.gradeLevel + ' / Duration: ' + formData.timeMinutes + ' min / Characters: exactly ' + characterCount + '\n' +
        (charNamesForPrompt ? '- Character names MUST be: ' + charNamesForPrompt + '\n' : '') +
        (formData.includeDiscussionLeader ? '- Include a discussion facilitator\n' : '') +
        (formData.includeStudentTeacherLayout ? '- Include teacher/student roles\n' : '') +
        (formData.includeAchievementStandards ? '- Include Korean curriculum achievement standards\n' : '') + '\n' +
        '[SCENE LABELS]\n' +
        'Use character="📍장면" only when the scene clearly changes. Do not force a rigid 4-act structure; keep the story natural and engaging.\n' +
        'Example labels: "[도입 - 발단]", "[전개 - 갈등 심화]", "[절정 - 위기]", "[결말 - 해소와 성찰]"\n\n' +
        '[DIALOGUE RULES]\n' +
        '★★★ VOLUME: min ' + minDialogueCount + ' lines, min ' + expectedDialogueLength + ' characters total. Each line 2~4 sentences, min 80 chars. ' + characterCount + ' characters, min ' + Math.floor(minDialogueCount / characterCount) + ' lines each ★★★\n' +
        '- Natural English for ' + formData.gradeLevel + ' Korean learners. Korean emotion cues in parentheses: (놀라며), (기쁘게)\n' +
        '- Reactive dialogue: no 3+ consecutive monologues. Mix simple and slightly challenging sentences\n' +
        '- Character descriptions: specific and natural (e.g. "friend who gets nervous in front of others"), not generic like "expert student" or awkward phrases\n\n' +
        'Respond in this exact JSON format:\n' + engJsonBlock;
    }

    console.log('Calling OpenAI GPT-4o-mini API for user ' + user.id + ' (subject: ' + formData.subject + ')');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openaiApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: prompt
          }
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
    const content = data.choices[0].message.content;

    // Parse JSON from response
    let scriptData;
    try {
      scriptData = JSON.parse(content);
      
      // Validate the generated script
      console.log(`Script validation for user ${user.id}:`, {
        characterCount: scriptData.characters?.length,
        expectedCharacterCount: formData.characterCount,
        dialogueCount: scriptData.dialogue?.length,
        expectedMinDialogue: minDialogueCount,
        isEnglish: isEnglish,
        sampleDialogue: scriptData.dialogue?.[0]?.line
      });

      // Check if character count matches
      if (scriptData.characters?.length !== formData.characterCount) {
        console.warn(`Character count mismatch: expected ${formData.characterCount}, got ${scriptData.characters?.length}`);
      }

      // Check if dialogue count is sufficient
      if (scriptData.dialogue?.length < minDialogueCount) {
        console.warn(`Dialogue count below minimum: expected ${minDialogueCount}, got ${scriptData.dialogue?.length}`);
      }

    } catch (parseError) {
      console.log(`JSON parsing error: ${parseError}. Raw content: ${content}`);
      return c.json({ error: 'Failed to parse API response' }, 500);
    }

    console.log(`Script generated successfully for user ${user.id}: ${scriptData.title}`);
    return c.json({ script: scriptData });

  } catch (error) {
    console.log(`Generate script server error: ${error}`);
    return c.json({ error: `Internal server error while generating script: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);