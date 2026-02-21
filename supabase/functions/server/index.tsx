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
    const prompt = `당신은 초등학교 교사를 위한 교육 전문가입니다.

다음 조건에 맞는 역할극 수업 주제를 1개만 생성해주세요:
- 과목: ${subject}
- 학년: ${gradeLevel}

주제는 다음 기준을 만족해야 합니다:
1. 해당 과목과 학년에 적합한 교육 내용
2. 역할극으로 표현하기 좋은 구체적인 상황
3. 학생들이 흥미롭게 참여할 수 있는 내용
4. 20-30자 내외의 명확한 제목

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
    
    const prompt = isEnglish ? 
    `You are an expert in creating educational role-play scripts for elementary school teachers.

Please create an educational role-play script with the following conditions:

**CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:**
- Subject: English (과목: 영어)
- Topic: ${formData.topic}
- Grade Level: ${formData.gradeLevel}
- Group Size: ${formData.groupSize} students
- Class Time: ${formData.timeMinutes} minutes
- Number of Characters: ${formData.characterCount} characters (MUST be exactly ${formData.characterCount})
${charNamesForPrompt ? `- Character names MUST be EXACTLY: ${charNamesForPrompt} (use these exact names including the number prefix)` : ''}
${formData.includeDiscussionLeader ? '- Include discussion leader role' : ''}
${formData.includeStudentTeacherLayout ? '- Include student-teacher layout' : ''}
${formData.includeAchievementStandards ? '- Include achievement standards' : ''}

**IMPORTANT: Script Length Guidelines**
- Total dialogue must have at least ${minDialogueCount} lines.
- Total character count of all dialogue should be approximately ${expectedDialogueLength} characters. (1 A4 page per minute)
- Each line should be substantial, not too short. (minimum 30 characters)
- Create sufficient content for ${formData.timeMinutes} minutes of role-play.
- Distribute dialogue: Introduction (20%) → Development (50%) → Conclusion (30%)

**CRITICAL: ALL dialogue MUST be in ENGLISH**
- Every line in the "dialogue" array MUST be written in English
- This is for English language learning, so all speaking parts must be in English
- The dialogue should be appropriate for ${formData.gradeLevel} Korean elementary students learning English

**Character Requirements:**
- You MUST create exactly ${formData.characterCount} characters in the "characters" array
${charNamesForPrompt ? `- Use EXACTLY these character names (with number prefix): ${charNamesForPrompt}` : '- Character names should be in English (e.g., Emma, John, Teacher, Student A)'}
- Each character MUST have dialogue lines
- Distribute dialogue evenly among all ${formData.characterCount} characters

Script Writing Principles:
1. Distribute dialogue evenly among all ${formData.characterCount} characters.
2. Naturally incorporate educational content about "${formData.topic}" into the dialogue.
3. Write realistic dialogue that ${formData.gradeLevel} students can actually perform.
4. Include emotional and action cues in parentheses. Example: (surprised), (nodding)
5. Reinforce important educational messages through repetition.
6. Make sure the role-play can be performed in ${formData.timeMinutes} minutes with ${formData.groupSize} students.

Respond in the following JSON format:
{
  "title": "Role-play Title (in English)",
  "situationAndRole": "Situation and role description in Korean (200+ characters). Include: 이 역할극은 ${formData.timeMinutes}분 동안 ${formData.groupSize}명의 학생이 ${formData.characterCount}명의 등장인물을 연기합니다. 등장인물: ${charListText}",
  "keyTerms": [{"term": "English term", "definition": "Korean definition"}],
  "characters": [{"name": "${charNamesForPrompt ? 'Exact character name with number prefix as listed' : 'Character name (English)'}", "description": "Detailed description in Korean (50+ characters)"}],
  "dialogue": [{"character": "${charNamesForPrompt ? 'Exact character name with number prefix' : 'Character name'}", "line": "Dialogue line IN ENGLISH (minimum 30 characters)"}],
  "teachingPoints": ["Detailed teaching point in Korean (100+ characters each, minimum 5 points)"],
  "teacherTips": ["Practical tips for teachers in Korean (80+ characters each, minimum 4 tips)."],
  "achievementStandards": {"subject": "영어", "standard": "Complete achievement standards for ${formData.gradeLevel} in Korean"},
  "closingQuestions": ["Thought-provoking closing questions in Korean (50+ characters each, minimum 3 questions)"]
}` 
    : 
    `당신은 초등학교 교사를 위한 역할극 대본 생성 전문가입니다.

다음 조건에 맞는 교육용 역할극 대본을 생성해주세요:

**반드시 지켜야 할 핵심 조건:**
- 과목: ${formData.subject}
- 주제: ${formData.topic}
- 학년: ${formData.gradeLevel}
- 모둠 인원: ${formData.groupSize}명
- 수업 시간: ${formData.timeMinutes}분
- 등장인물 수: ${formData.characterCount}명 (정확히 ${formData.characterCount}명)
${charNamesForPrompt ? `- 등장인물 이름은 반드시 다음 이름을 그대로 사용: ${charNamesForPrompt} (번호 포함한 이름 전체를 그대로 사용)` : ''}
${formData.includeDiscussionLeader ? '- 토론 리더 역할 포함' : ''}
${formData.includeStudentTeacherLayout ? '- 학생-교사 배치 포함' : ''}
${formData.includeAchievementStandards ? '- 성취 기준 포함' : ''}

**중요: 대본 분량 가이드라인**
- 전체 대사(dialogue)는 최소 ${minDialogueCount}개 이상
- 전체 대사 총 글자수는 약 ${expectedDialogueLength}자 (1분당 A4 1장)
- 각 대사는 최소 30자 이상
- 대사는 도입부(20%) → 전개부(50%) → 정리부(30%) 구조

**등장인물 조건:**
- "characters" 배열에 정확히 ${formData.characterCount}명 생성
${charNamesForPrompt ? `- 이름은 반드시: ${charNamesForPrompt} 순서대로 사용 (번호.이름 형식 그대로)` : ''}
- 모든 캐릭터에 대사 배분

대본 작성 원칙:
1. ${formData.characterCount}명 모두에게 대사를 고르게 배분합니다.
2. "${formData.topic}" 주제를 대사에 자연스럽게 녹여냅니다.
3. ${formData.gradeLevel} 학생들이 연기할 수 있는 현실적인 대사로 작성합니다.
4. 대사에 감정·행동 지시를 괄호로 표시합니다. 예: (놀라며), (고개를 끄덕이며)
5. ${formData.groupSize}명의 학생이 ${formData.timeMinutes}분 동안 수행할 수 있도록 작성합니다.

다음 형식의 JSON으로 응답해주세요:
{
  "title": "역할극 제목",
  "situationAndRole": "상황 및 역할 설명 (200자 이상). 반드시 포함: 이 역할극은 ${formData.timeMinutes}분 동안 ${formData.groupSize}명의 학생이 ${formData.characterCount}명의 등장인물을 연기합니다. 등장인물: ${charListText}",
  "keyTerms": [{"term": "용어", "definition": "정의"}],
  "characters": [{"name": "${charNamesForPrompt ? '지정된 번호.이름 그대로 사용' : '캐릭터명'}", "description": "성격과 역할 설명 (50자 이상)"}],
  "dialogue": [{"character": "${charNamesForPrompt ? '지정된 번호.이름 그대로 사용' : '캐릭터명'}", "line": "대사 내용 (최소 30자 이상)"}],
  "teachingPoints": ["교육 포인트 (각 100자 이상, 최소 5개)"],
  "teacherTips": ["교사용 팁 (각 80자 이상, 최소 4개)"],
  "achievementStandards": {"subject": "${formData.subject}", "standard": "${formData.gradeLevel} 성취기준 전체 내용"},
  "closingQuestions": ["마무리 질문 (각 50자 이상, 최소 3개)"]
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
              ? 'You are an expert in creating educational content for elementary school teachers. You always respond in JSON format and create rich, substantive role-play scripts that follow the specified length requirements. For English subject, ALL dialogue lines MUST be written in English.'
              : '당신은 초등학교 교사를 위한 교육 콘텐츠 생성 전문가입니다. 항상 JSON 형식으로 응답하며, 지정된 분량을 정확히 준수하여 충실하고 풍부한 내용의 역할극 대본을 작성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
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