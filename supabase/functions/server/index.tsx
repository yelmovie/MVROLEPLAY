import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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
      '1. 해당 과목의 핵심 목표가 드라마 속에서 자연스럽게 드러나는 상황\n' +
      '2. 기승전결 구조로 풀어낼 수 있는 갈등이 있는 구체적 사건\n' +
      '3. ' + gradeLevel + ' 학생 수준에 적합\n' +
      '4. 20-30자 내외의 생생하고 흥미로운 제목\n\n' +
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
    // 1분당 평균 대사 12줄, 각 대사 평균 50자 기준
    const minDialogueCount = Math.max(formData.timeMinutes * 12, 24);
    const expectedDialogueLength = formData.timeMinutes * 600;
    const isEnglish = formData.subject === '영어';
    const characterCount = formData.characterCount || formData.groupSize || 5;

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

    // 4막 레이블 규칙
    const actLabelRule =
      '각 막 시작 시 character 필드를 "📍장면"으로, line 필드에 막 레이블을 넣으세요:\n' +
      '  막1: "[도입 - 발단] 장면 지문"\n' +
      '  막2: "[전개 - 갈등 심화] 장면 지문"\n' +
      '  막3: "[절정 - 위기] 장면 지문"\n' +
      '  막4: "[결말 - 해소와 성찰] 장면 지문"';

    // 공통 대사 규칙 (시간 비례 강제)
    const dialogueRules =
      '★ 대사 수량 필수 준수 ★\n' +
      '- 공연 시간 ' + formData.timeMinutes + '분에 맞춰 대사를 충분히 생성\n' +
      '- 전체 대사 수: 반드시 최소 ' + minDialogueCount + '개 이상 (4막 레이블 제외, 실제 대사만 카운트)\n' +
      '- 총 대사 글자 수: 최소 ' + expectedDialogueLength + '자 이상\n' +
      '- 각 대사: 최소 30자 이상의 실질적 대사\n' +
      '- 등장인물 ' + characterCount + '명 모두에게 대사 균등 배분 (인물당 최소 ' + Math.floor(minDialogueCount / characterCount) + '개 이상)\n' +
      '- 아이들 실제 말투 사용 (존댓말.반말 캐릭터별 구분)\n' +
      '- 감정 지문 괄호 표시: (울먹이며), (화나서), (용기를 내서)\n' +
      '- 짧은 대사 + 긴 감정 대사 섞어 극적 리듬 만들기\n' +
      '- 교훈 설명 대사 금지. 행동.감정으로만 표현';

    // 과목별 프롬프트와 시스템 메시지 구성
    let prompt = '';
    let systemContent = '';

    if (formData.subject === '국어') {
      systemContent =
        '당신은 초등학교 국어과 교육연극 전문 극작가입니다.\n' +
        '말하기.듣기.읽기.쓰기 국어 역량이 극의 갈등과 해결 속에서 자연스럽게 드러나는 희곡 대본을 씁니다.\n' +
        '항상 유효한 JSON 형식으로 응답합니다.';
      prompt =
        '초등학교 국어과 교육 연극 대본을 작성해주세요.\n\n' +
        '[국어 역할극 핵심]\n' +
        '- 목표: 실제 아이들의 학교 이야기를 희곡(연극 대본) 형식으로 표현\n' +
        '- 국어 역량(말하기.듣기.읽기.쓰기)이 극의 사건 속에서 자연스럽게 등장해야 함\n' +
        '- 예: 발표를 못하는 아이의 갈등, 잘못 전달된 말 한마디로 벌어지는 오해, 글쓰기로 마음을 전하는 장면\n' +
        '- 희곡 형식 준수: 지문(무대 지시), 대사, 막 구성\n\n' +
        '[대본 조건]\n' +
        '- 과목: 국어\n' +
        '- 주제: ' + formData.topic + '\n' +
        '- 학년: ' + formData.gradeLevel + '\n' +
        '- 공연 인원: ' + formData.groupSize + '명\n' +
        '- 공연 시간: ' + formData.timeMinutes + '분\n' +
        '- 등장인물 수: 정확히 ' + characterCount + '명\n' +
        (charInstruction ? '- ' + charInstruction + '\n' : '') +
        optionLines + '\n\n' +
        '[4막 레이블 규칙]\n' + actLabelRule + '\n\n' +
        '[4막 구조]\n' +
        '막1 도입(발단): 등장인물 소개, 국어 역량 관련 상황의 씨앗 심기 (전체 대사 20%)\n' +
        '막2 전개(갈등 심화): 말.글.소통 문제로 오해나 갈등 깊어짐 (35%)\n' +
        '막3 절정(위기): 감정 폭발 또는 결정적 선택 (25%)\n' +
        '막4 결말(해소와 성찰): 올바른 표현.소통으로 해결, 국어 역량의 가치 깨달음 (20%)\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로 응답해주세요:\n' + jsonBlock;

    } else if (formData.subject === '사회') {
      systemContent =
        '당신은 초등학교 사회과 교육연극 전문 극작가입니다.\n' +
        '민주주의.인권.경제.공동체.지역사회.법 등 추상적 사회 개념을 갈등 상황으로 구체화합니다.\n' +
        '학생들이 역할 연기로 사회 개념을 몸으로 이해하는 대본을 씁니다.\n' +
        '항상 유효한 JSON 형식으로 응답합니다.';
      prompt =
        '초등학교 사회과 교육 연극 대본을 작성해주세요.\n\n' +
        '[사회 역할극 핵심]\n' +
        '- 목표: 사회 개념(민주주의.인권.경제.공동체.지역사회.법.문화)을 갈등을 통해 직접 경험\n' +
        '- 추상 개념이 실제 사건.갈등으로 등장해야 함 (개념 설명 금지, 체험으로 이해)\n' +
        '- 인물들이 사회 구성원(시민, 소비자, 지역 주민, 대표 등)으로 등장\n' +
        '- 가치 충돌(선/악 구도 아님) — 각 인물이 이해 가능한 이유로 행동\n\n' +
        '[대본 조건]\n' +
        '- 과목: 사회\n' +
        '- 주제: ' + formData.topic + '\n' +
        '- 학년: ' + formData.gradeLevel + '\n' +
        '- 공연 인원: ' + formData.groupSize + '명\n' +
        '- 공연 시간: ' + formData.timeMinutes + '분\n' +
        '- 등장인물 수: 정확히 ' + characterCount + '명\n' +
        (charInstruction ? '- ' + charInstruction + '\n' : '') +
        optionLines + '\n\n' +
        '[4막 레이블 규칙]\n' + actLabelRule + '\n\n' +
        '[4막 구조]\n' +
        '막1 도입(발단): 사회적 상황 소개, 이해관계 다른 인물들 등장 (전체 대사 20%)\n' +
        '막2 전개(갈등 심화): 사회 개념 관련 갈등.대립.불공정 심화 (35%)\n' +
        '막3 절정(위기): 결정적 선택 - 투표, 협상, 항의, 양보 중 선택 (25%)\n' +
        '막4 결말(해소와 성찰): 민주적 해결.합의, 사회 개념의 의미 행동으로 깨달음 (20%)\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로 응답해주세요:\n' + jsonBlock;

    } else if (formData.subject === '도덕') {
      systemContent =
        '당신은 초등학교 도덕과 교육연극 전문 극작가입니다.\n' +
        '도덕적 딜레마 상황에서 인물들이 갈등하고, 잘못된 선택->후회->깨달음의 여정을 보여줍니다.\n' +
        '교훈을 설명하지 않고, 인물의 행동과 결과로 도덕적 가치를 느끼게 합니다.\n' +
        '항상 유효한 JSON 형식으로 응답합니다.';
      prompt =
        '초등학교 도덕과 교육 연극 대본을 작성해주세요.\n\n' +
        '[도덕 역할극 핵심]\n' +
        '- 목표: 도덕적 딜레마 상황에서 스스로 옳고 그름을 판단, 올바른 가치를 내면화\n' +
        '- 핵심 도덕 가치(정직.배려.용기.공감.책임.존중.정의.우정)가 갈등 속에서 시험받아야 함\n' +
        '- 인물이 쉬운 선택(거짓말, 방관, 이기심)과 어려운 선택(용기, 고백, 희생) 사이에서 갈등\n' +
        '- 교훈을 대사로 설명하지 않고, 선택과 그 결과로 도덕적 의미 전달\n' +
        '- 모든 인물이 이해 가능한 이유로 행동 (선악 구도 금지)\n\n' +
        '[대본 조건]\n' +
        '- 과목: 도덕\n' +
        '- 주제: ' + formData.topic + '\n' +
        '- 학년: ' + formData.gradeLevel + '\n' +
        '- 공연 인원: ' + formData.groupSize + '명\n' +
        '- 공연 시간: ' + formData.timeMinutes + '분\n' +
        '- 등장인물 수: 정확히 ' + characterCount + '명\n' +
        (charInstruction ? '- ' + charInstruction + '\n' : '') +
        optionLines + '\n\n' +
        '[4막 레이블 규칙]\n' + actLabelRule + '\n\n' +
        '[4막 구조]\n' +
        '막1 도입(발단): 평범한 일상 속 도덕적 딜레마의 씨앗 - 유혹이나 어려운 선택의 시작 (전체 대사 20%)\n' +
        '막2 전개(갈등 심화): 잘못된 선택 또는 방관이 가져오는 결과, 내면 갈등 심화 (35%)\n' +
        '막3 절정(위기): 진실 앞에 서는 순간 - 계속 숨길 것인가, 용기 내어 고백할 것인가 (25%)\n' +
        '막4 결말(해소와 성찰): 용기 있는 선택->관계 회복->도덕적 가치 깨달음 (설명 없이 행동으로) (20%)\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로 응답해주세요:\n' + jsonBlock;

    } else if (formData.subject === '역사') {
      systemContent =
        '당신은 초등학교 역사과 교육연극 전문 극작가입니다.\n' +
        '역사적 시대와 사건을 그 시대 인물들의 시각에서 직접 경험하는 역사극을 씁니다.\n' +
        '역사적 사실에 충실하되, 그 시대 사람들의 감정과 선택을 극적으로 표현합니다.\n' +
        '항상 유효한 JSON 형식으로 응답합니다.';
      prompt =
        '초등학교 역사과 교육 연극 대본을 작성해주세요.\n\n' +
        '[역사 역할극 핵심]\n' +
        '- 목표: 역사적 시대와 사건을 그 시대 인물들의 눈으로 직접 경험\n' +
        '- 역사적 사실과 시대 배경이 정확해야 하며, 그 시대 사람들의 생각.감정.선택이 중심\n' +
        '- 교과서 암기가 아닌 역사적 인물들의 삶 속으로 들어가는 체험\n' +
        '- 시대적 말투와 표현 방식 반영 (현대적이지 않게, 하지만 이해 가능한 수준)\n' +
        '- 역사적 사건의 의미를 마지막에 내레이터나 시 형식으로 정리 가능\n\n' +
        '[대본 조건]\n' +
        '- 과목: 역사\n' +
        '- 주제: ' + formData.topic + '\n' +
        '- 학년: ' + formData.gradeLevel + '\n' +
        '- 공연 인원: ' + formData.groupSize + '명\n' +
        '- 공연 시간: ' + formData.timeMinutes + '분\n' +
        '- 등장인물 수: 정확히 ' + characterCount + '명\n' +
        (charInstruction ? '- ' + charInstruction + '\n' : '') +
        optionLines + '\n\n' +
        '[4막 레이블 규칙]\n' + actLabelRule + '\n\n' +
        '[4막 구조]\n' +
        '막1 도입(발단): 시대.장소.인물 소개, 역사적 사건의 씨앗 (고요한 일상 속 긴장감) (전체 대사 20%)\n' +
        '막2 전개(갈등 심화): 역사적 사건 본격 전개, 인물들의 선택과 갈등 (35%)\n' +
        '막3 절정(위기): 역사적 결정의 순간 - 행동할 것인가 침묵할 것인가, 목숨을 건 선택 (25%)\n' +
        '막4 결말(해소와 성찰): 역사적 결과와 의미, 오늘날과 연결되는 울림 (20%)\n\n' +
        '[대사 규칙]\n' + dialogueRules + '\n\n' +
        '다음 JSON 형식으로 응답해주세요:\n' + jsonBlock;

    } else {
      // 영어
      systemContent =
        'You are an award-winning elementary school English drama specialist.\n' +
        'You write scripts where TARGET English expressions appear NATURALLY and REPEATEDLY.\n' +
        'Students learn by speaking English in context, not through drills.\n' +
        'Always respond in valid JSON format.';
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
        'Write an elementary school English drama script.\n\n' +
        '[ENGLISH ROLEPLAY CORE]\n' +
        '- Goal: Students practice TARGET English expressions by performing a dramatic story\n' +
        '- Key expressions for "' + formData.topic + '" must appear NATURALLY 8-12+ times\n' +
        '- Vocabulary and grammar emerge through REAL communication needs, not drills\n' +
        '- Each target expression appears 2-3 times in different contexts\n\n' +
        '[SCRIPT CONDITIONS]\n' +
        '- Subject: English\n' +
        '- Topic: ' + formData.topic + '\n' +
        '- Grade Level: ' + formData.gradeLevel + ' (Korean elementary)\n' +
        '- Performers: ' + formData.groupSize + ' students\n' +
        '- Duration: ' + formData.timeMinutes + ' minutes\n' +
        '- Characters: exactly ' + characterCount + '\n' +
        (charNamesForPrompt ? '- Character names MUST be: ' + charNamesForPrompt + '\n' : '') +
        (formData.includeDiscussionLeader ? '- Include a discussion facilitator character\n' : '') +
        (formData.includeStudentTeacherLayout ? '- Include teacher/student role distinction\n' : '') +
        (formData.includeAchievementStandards ? '- Include Korean curriculum achievement standards\n' : '') + '\n' +
        '[4-ACT LABEL RULE]\n' +
        'Each act starts with character="📍장면" and line="[Act Label] stage direction":\n' +
        '  Act 1: "[도입 - 발단] stage direction"\n' +
        '  Act 2: "[전개 - 갈등 심화] stage direction"\n' +
        '  Act 3: "[절정 - 위기] stage direction"\n' +
        '  Act 4: "[결말 - 해소와 성찰] stage direction"\n\n' +
        '[4-ACT STRUCTURE]\n' +
        'Act 1 - Setup (20%): Introduce characters, establish situation, first use of target expressions\n' +
        'Act 2 - Rising (35%): Conflict develops, target expressions in emotional context\n' +
        'Act 3 - Crisis (25%): Peak moment requiring target language\n' +
        'Act 4 - Resolution (20%): Genuine resolution, target expressions used meaningfully\n\n' +
        '[DIALOGUE RULES]\n' +
        '★ MANDATORY DIALOGUE VOLUME ★\n' +
        '- Performance duration: ' + formData.timeMinutes + ' minutes\n' +
        '- Total dialogue lines: MINIMUM ' + minDialogueCount + ' lines (act labels not counted)\n' +
        '- Total dialogue length: MINIMUM ' + expectedDialogueLength + ' characters\n' +
        '- Each line: minimum 30 characters\n' +
        '- ALL dialogue in natural English (appropriate for ' + formData.gradeLevel + ' Korean learners)\n' +
        '- Spread evenly: ' + characterCount + ' characters, minimum ' + Math.floor(minDialogueCount / characterCount) + ' lines each\n' +
        '- Korean emotion cues in parentheses: (놀라며), (화가 나서), (기쁘게)\n' +
        '- Mix simple (A2) and slightly challenging (B1) sentences\n\n' +
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
        temperature: 0.92,
        max_tokens: Math.min(16000, Math.max(8000, formData.timeMinutes * 800)),
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