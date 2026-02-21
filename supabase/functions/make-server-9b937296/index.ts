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

    // Create prompt for topic generation
    const prompt = `당신은 초등학교 교사를 위한 교육 연극 전문가입니다.

다음 조건에 맞는 역할극 수업 주제를 1개만 생성해주세요:
- 과목: ${subject}
- 학년: ${gradeLevel}

주제는 다음 기준을 반드시 만족해야 합니다:
1. 실제 아이들이 학교나 일상에서 경험할 법한 구체적인 사건이나 갈등 상황
2. 등장인물들 사이에 감정적 긴장감이 있어 기승전결 구조로 풀어낼 수 있는 내용
3. 교과 내용이 그 상황 속에 자연스럽게 녹아드는 주제
4. 예시: "급식 줄에서 새치기 사건", "단짝 친구의 배신과 화해", "발표 대신 나서준 짝꿍" 등
5. 20-30자 내외의 생생하고 흥미로운 제목

JSON 형식으로 응답해주세요:
{
  "topic": "생성된 주제"
}`;

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
    const expectedDialogueLength = formData.timeMinutes * 450;
    const minDialogueCount = Math.max(formData.timeMinutes * 8, 20);
    const isEnglish = formData.subject === '영어';

    // 커스텀 역할명 목록 (있으면 사용, 없으면 기본 번호로)
    const customChars: Array<{ number: number; name: string }> = formData.customCharacters || [];
    const hasCustomNames = customChars.length > 0 && customChars.some(c => c.name && !c.name.startsWith('등장인물'));
    const charListText = customChars.length > 0
      ? customChars.map(c => `${c.number}번. ${c.name}`).join(', ')
      : `${formData.characterCount}명 (자유롭게 이름 설정)`;
    const charNamesForPrompt = customChars.length > 0
      ? customChars.map(c => `"${c.number}. ${c.name}"`).join(', ')
      : null;
    
    // 장르/구조 레이블
    const actLabels = ['[도입 — 발단]', '[전개 — 갈등 심화]', '[절정 — 위기]', '[결말 — 해소와 성찰]'];
    const actGuide = `대사는 4막으로 구분하여 생성합니다:
  - 막1 도입(발단): 등장인물과 상황 소개, 갈등의 씨앗 심기 (전체 대사의 약 20%)
  - 막2 전개(갈등 심화): 오해·충돌이 깊어지는 사건 전개 (약 35%)
  - 막3 절정(위기): 감정이 폭발하거나 결정적 선택을 해야 하는 순간 (약 25%)
  - 막4 결말(해소와 성찰): 화해·해결·깨달음, 교과 핵심 가치 정리 (약 20%)
  각 막의 시작 대사 앞에는 "[도입 — 발단]", "[전개 — 갈등 심화]", "[절정 — 위기]", "[결말 — 해소와 성찰]" 레이블을 line 필드 맨 앞에 붙여주세요. 단, 레이블이 붙은 줄은 character를 "📍장면"으로 설정하세요.`;

    const prompt = isEnglish ? 
    `You are a playwright specializing in educational drama for elementary school students.
Your scripts must feel like REAL LIFE — children talking the way they actually talk, facing situations they really experience.

═══ MISSION ═══
Write a dramatic 4-act educational roleplay script that feels like a genuine children's play.
The story must have a CLEAR NARRATIVE ARC: Setup → Rising Conflict → Crisis → Resolution.
Educational content about "${formData.topic}" must emerge NATURALLY from the drama, not as lectures.

═══ SCRIPT CONDITIONS ═══
- Subject: English (과목: 영어)
- Topic/Theme: ${formData.topic}
- Grade Level: ${formData.gradeLevel} (Korean elementary)
- Number of Performers: ${formData.groupSize} students
- Performance Time: ${formData.timeMinutes} minutes
- Number of Characters: exactly ${formData.characterCount}
${charNamesForPrompt ? `- Character names MUST be: ${charNamesForPrompt}` : ''}
${formData.includeDiscussionLeader ? '- Include a discussion facilitator character' : ''}
${formData.includeStudentTeacherLayout ? '- Include teacher/student role distinction' : ''}
${formData.includeAchievementStandards ? '- Include Korean curriculum achievement standards' : ''}

═══ DRAMATIC STRUCTURE (4 Acts) ═══
${actGuide}

Act 1 — Setup (20%): Introduce characters and plant the seed of conflict naturally
Act 2 — Rising Action (35%): Misunderstandings deepen, tension grows, sides form
Act 3 — Crisis (25%): Emotional peak — someone must make a hard choice or face a hard truth
Act 4 — Resolution (20%): Genuine reconciliation, lesson learned through the characters' experience

═══ DIALOGUE RULES ═══
- Total lines: at least ${minDialogueCount} lines
- Each line: minimum 30 characters of actual English dialogue
- Total dialogue length: ~${expectedDialogueLength} characters
- Dialogue MUST be in natural English appropriate for ${formData.gradeLevel} Korean learners
- Include realistic emotions: surprise, frustration, sadness, relief, joy
- Action/emotion cues in parentheses: (whispering), (turns away angrily), (eyes filling with tears)
- NO stilted speeches. Real kids argue, whisper, hesitate, blurt things out.
- Mix short punchy lines with longer emotional speeches for dramatic rhythm

═══ CHARACTER WRITING ═══
- Each character must have a distinct personality and VOICE
- ${charNamesForPrompt ? `Use EXACTLY these names: ${charNamesForPrompt}` : 'Give characters relatable names'}
- Every character must participate meaningfully in the conflict
- Spread dialogue evenly among all ${formData.characterCount} characters

═══ STORY QUALITY CHECKLIST ═══
✓ Does the story feel like something real kids would experience?
✓ Is there genuine emotional tension?
✓ Does the educational concept emerge from the drama naturally?
✓ Would students WANT to perform this?

Respond in this exact JSON format:
{
  "title": "Engaging play title in English",
  "situationAndRole": "Vivid scene-setting description in Korean (200+ chars). Describe the setting, atmosphere, and what each character wants at the start. Include: 이 역할극은 ${formData.timeMinutes}분 동안 ${formData.groupSize}명의 학생이 ${formData.characterCount}명의 등장인물을 연기합니다. 등장인물: ${charListText}",
  "keyTerms": [{"term": "Key English term from the story", "definition": "Korean definition with usage example"}],
  "characters": [{"name": "Character name", "description": "Personality, role in story, and emotional journey (50+ chars in Korean)"}],
  "dialogue": [{"character": "Character name OR '📍장면' for act labels", "line": "Dialogue or '[Act Label] Scene description'"}],
  "teachingPoints": ["How this dramatic moment connects to the learning objective (100+ chars, 5+ points)"],
  "teacherTips": ["Practical drama coaching tips for teachers (80+ chars, 4+ tips)"],
  "achievementStandards": {"subject": "영어", "standard": "Relevant ${formData.gradeLevel} curriculum standards in Korean"},
  "closingQuestions": ["Reflection question connecting the play's story to real life (50+ chars, 3+ questions)"]
}`
    :
    `당신은 초등학교 교육 연극 작가입니다.
아이들이 실제로 경험하는 생생한 이야기를 연극 대본으로 써야 합니다.
교육 내용은 강의처럼 전달하지 말고, 극적인 사건 속에서 자연스럽게 드러나야 합니다.

═══ 핵심 목표 ═══
기승전결이 뚜렷한 4막 구조의 연극 대본을 작성합니다.
• 이야기는 실제 아이들이 학교·일상에서 겪을 법한 구체적인 사건에서 출발합니다.
• 등장인물들 사이에 진짜 감정적 갈등(오해, 다툼, 외면, 선택의 기로)이 있어야 합니다.
• 교과 내용(${formData.subject}: ${formData.topic})은 이 드라마 속에서 자연스럽게 녹아나야 합니다.
• 아이들이 실제로 연기하고 싶을 만큼 흥미롭고 공감 가는 대본이어야 합니다.

═══ 대본 조건 ═══
- 과목: ${formData.subject}
- 주제/소재: ${formData.topic}
- 학년: ${formData.gradeLevel}
- 공연 인원: ${formData.groupSize}명
- 공연 시간: ${formData.timeMinutes}분
- 등장인물 수: 정확히 ${formData.characterCount}명
${charNamesForPrompt ? `- 등장인물 이름 반드시 사용: ${charNamesForPrompt}` : ''}
${formData.includeDiscussionLeader ? '- 토론 진행자 역할 포함' : ''}
${formData.includeStudentTeacherLayout ? '- 교사·학생 역할 구분 포함' : ''}
${formData.includeAchievementStandards ? '- 교육과정 성취기준 포함' : ''}

═══ 4막 극 구조 (반드시 준수) ═══
${actGuide}

막1 도입(발단) — 전체 대사의 약 20%:
  등장인물이 소개되고 갈등의 씨앗이 뿌려집니다.
  예) 친구 사이에 작은 오해가 생기거나, 불공정한 상황이 시작됩니다.

막2 전개(갈등 심화) — 약 35%:
  오해가 깊어지고, 편이 갈리거나, 상처 주는 말이 오갑니다.
  감정이 고조되어야 합니다. 관객(학생들)이 "어떻게 되지?" 궁금해야 합니다.

막3 절정(위기) — 약 25%:
  감정이 터지는 순간, 또는 결정적인 선택을 해야 하는 장면입니다.
  누군가 울거나, 소리치거나, 용기 있는 행동을 하거나, 진실이 드러납니다.

막4 결말(해소와 성찰) — 약 20%:
  화해·해결·깨달음이 일어납니다.
  교과의 핵심 가치가 억지 설명 없이 행동으로 드러나야 합니다.

═══ 대사 작성 규칙 ═══
- 전체 대사 수: 최소 ${minDialogueCount}개
- 각 대사: 최소 30자
- 총 대사 분량: 약 ${expectedDialogueLength}자
- 아이들이 실제 쓰는 말투 사용 (존댓말·반말 캐릭터별로 구분)
- 감정 지문을 괄호로 표시: (울먹이며), (화나서 뒤돌아서며), (몰래 눈물을 훔치며), (용기를 내서)
- 짧고 날카로운 대사와 감정이 담긴 긴 대사를 섞어 극적 리듬 만들기
- 강의하듯 교훈을 설명하는 대사 금지. 행동과 감정으로 보여줄 것.
- 모든 등장인물에게 대사를 균등하게 배분하되, 각 인물의 성격이 대사에서 드러나야 함

═══ 인물 설정 ═══
${charNamesForPrompt ? `이름: ${charNamesForPrompt} (번호.이름 형식 그대로 사용)` : `${formData.characterCount}명의 개성 있는 인물`}
- 각 인물은 고유한 성격, 말투, 원하는 것(욕구)을 가져야 합니다.
- 갈등의 모든 측면을 인물들이 자연스럽게 대변해야 합니다.

═══ 품질 체크리스트 ═══
✓ 실제 아이들이 학교에서 겪을 법한 사건인가?
✓ 감정적 갈등이 진짜 같이 느껴지는가?
✓ 교과 내용이 자연스럽게 녹아있는가?
✓ 아이들이 연기하고 싶어할 만큼 재미있는가?
✓ 기승전결이 뚜렷한가?

다음 JSON 형식으로 응답해주세요:
{
  "title": "흥미롭고 생생한 역할극 제목",
  "situationAndRole": "배경 설명: 어디서, 어떤 상황에서 이야기가 시작되는지 생생하게 묘사 (200자 이상). 각 인물이 처음에 무엇을 원하는지 포함. 반드시 포함: 이 역할극은 ${formData.timeMinutes}분 동안 ${formData.groupSize}명의 학생이 ${formData.characterCount}명의 등장인물을 연기합니다. 등장인물: ${charListText}",
  "keyTerms": [{"term": "이야기에 등장하는 핵심 개념/용어", "definition": "뜻과 이야기 속 쓰임새 설명"}],
  "characters": [{"name": "${charNamesForPrompt ? '지정된 번호.이름 그대로' : '인물명'}", "description": "성격, 이야기 속 역할, 감정적 여정을 구체적으로 (50자 이상)"}],
  "dialogue": [{"character": "인물명 또는 '📍장면'(막 구분 레이블용)", "line": "대사 또는 '[막 레이블] 장면 지문'"}],
  "teachingPoints": ["이 극적 장면이 교육 목표와 어떻게 연결되는지 구체적으로 (100자 이상, 5개 이상)"],
  "teacherTips": ["연극 지도·운영 실용 팁 (80자 이상, 4개 이상)"],
  "achievementStandards": {"subject": "${formData.subject}", "standard": "${formData.gradeLevel} 관련 성취기준 전체"},
  "closingQuestions": ["극의 이야기를 실제 삶과 연결하는 성찰 질문 (50자 이상, 3개 이상)"]
}`;

    console.log(`Calling OpenAI GPT-4o-mini API for user ${user.id} (${isEnglish ? 'English' : 'Korean'} script)`);

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
            content: isEnglish
              ? `You are an award-winning educational playwright for elementary schools.
Your scripts are celebrated because they feel REAL — like stories that could actually happen to children.
You write dialogue the way kids actually speak: sometimes awkward, sometimes funny, sometimes heartbreaking.
You never write lecture-style lines. Educational content emerges from DRAMA, not explanation.
You always respond in valid JSON format and strictly follow the 4-act dramatic structure.
For English subject, ALL dialogue lines MUST be in natural English.`
              : `당신은 초등학교 교육 연극 분야의 전문 극작가입니다.
당신의 대본이 사랑받는 이유는 "진짜 같아서"입니다 — 실제 아이들이 경험할 법한 이야기이기 때문입니다.
아이들이 실제 쓰는 말투로 씁니다: 때론 어색하고, 때론 웃기고, 때론 가슴 아픈 대사.
교훈적인 설명 대사는 절대 쓰지 않습니다. 교육 내용은 드라마와 갈등을 통해 자연스럽게 드러납니다.
반드시 기승전결(4막) 구조를 지키며, 항상 유효한 JSON 형식으로 응답합니다.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.92,
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