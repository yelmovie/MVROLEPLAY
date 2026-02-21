import { ScriptFormData, GeneratedScript } from '../App';

export function generateScript(formData: ScriptFormData): GeneratedScript {
  const { subject, topic, gradeLevel, groupSize, timeMinutes, characterCount } = formData;

  // Generate sample script based on form data
  const characters = generateCharacters(characterCount, subject);
  const dialogue = generateDialogue(characters, topic, subject);
  
  return {
    formData,
    title: topic,
    situationAndRole: generateSituationAndRole(topic, gradeLevel),
    keyTerms: generateKeyTerms(subject, topic),
    characters,
    dialogue,
    teachingPoints: generateTeachingPoints(subject),
    teacherTips: generateTeacherTips(timeMinutes),
    achievementStandards: generateAchievementStandards(subject, gradeLevel),
    closingQuestions: generateClosingQuestions(topic),
  };
}

function generateCharacters(count: number, subject: string) {
  const baseNames = ['민준', '서연', '지우', '하은', '도윤', '서연', '예준', '수아', '시우', '지아', '유준', '채원'];
  const roles = ['우열적 친구', '논리적인 친구', '중립적인 친구', '공감적인 친구', '활발한 친구', '조용한 친구'];
  
  return Array.from({ length: count }, (_, i) => ({
    name: baseNames[i % baseNames.length],
    description: i === 0 
      ? '갈등의 호프를 만족하고자 용서를 구하는 말'
      : roles[i % roles.length]
  }));
}

function generateSituationAndRole(topic: string, gradeLevel: string): string {
  return `친구 사이에 말다툼 후 화해하는 과정을 연습합니다. 각자 역할을 맡아 상치 존 말과 사과하는 방법을 배웁니다. 대화를 통해 갈정을 표현하고 관계를 회복하는 방법을 익힙니다.`;
}

function generateKeyTerms(subject: string, topic: string) {
  const terms = {
    '국어': [
      { term: '사과', definition: '잘못을 인정하고 용서를 구하는 말\n(예문) 미안해, 내가 잘못했어.' },
      { term: '공감', definition: '다른 사람의 기분을 이해하는 것\n(예문) 너 화났었겠다. 내가 정말 미안해.' },
    ],
    '사회': [
      { term: '권리', definition: '사람이 마땅히 누려야 할 것' },
      { term: '책임', definition: '해야 할 일을 다하는 것' },
    ],
    '도덕': [
      { term: '정직', definition: '거짓 없이 바르고 곧은 마음' },
      { term: '배려', definition: '다른 사람을 생각하고 도와주는 것' },
    ],
    '역사': [
      { term: '독립운동', definition: '나라의 자유를 되찾기 위한 활동' },
      { term: '유관순', definition: '3·1운동에서 활약한 독립운동가' },
    ],
    '영어': [
      { term: 'Apologize', definition: 'To say sorry for something wrong' },
      { term: 'Forgive', definition: 'To stop being angry at someone' },
    ],
  };

  return terms[subject] || terms['국어'];
}

function generateDialogue(characters: Array<{ name: string; description: string }>, topic: string, subject: string) {
  const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600'];
  
  const dialogue = [
    {
      character: '내레이터',
      line: '민준과 지우가 복도에서 말다툼을 하고 있습니다.',
    },
    {
      character: characters[0]?.name || '민준',
      line: '너 왜 내 물건을 함부로 만져!',
      color: colors[0],
    },
    {
      character: characters[1]?.name || '지우',
      line: '내가 먼저 나한테 자꾸게 굴었잖아!',
      color: colors[1],
    },
  ];

  // Add additional characters if they exist
  if (characters.length > 2) {
    dialogue.push({
      character: characters[2]?.name || '선생님',
      line: '화해를 도와주는 역할. 중립적이고 따뜻함 / 조곤조곤 조언함',
      color: colors[2],
    });
  }

  if (characters.length > 3) {
    dialogue.push({
      character: characters[3]?.name || '하은',
      line: '옆에서 지켜보는 친구. 중재자 역할 / 경청하는 태도로 말함',
      color: colors[3],
    });
  }

  if (characters.length > 4) {
    dialogue.push({
      character: characters[4]?.name || '서연',
      line: '화해를 응원하는 친구. 긍정적인 분위기 만들기 / 밝은 표정으로 격려함',
      color: colors[4],
    });
  }

  return dialogue;
}

function generateTeachingPoints(subject: string): string[] {
  return [
    '경연의 호프를 따라가며 인물의 선택에 어슴을 맞춰 설명해 본다.',
    '갈등이 생기는 지점과 해결 방법을 찾아 자신의 경험과 연결해 본다.',
    '핵심 용어를 대사 속에서 다시 사용해 보며 의미를 확인한다.',
  ];
}

function generateTeacherTips(timeMinutes: number): string[] {
  return [
    '경연별로 역할을 나누고, 불합(늘무얼/썰독/반복)를 쁘께 연습한 뒤 시작합니다.',
    '시간이 봇으면 무대지시룰 1줄로 줄이고, 핵성 대사만 또박또박 읽게 지도합니다.',
    '마루리 질문 3개 중 1~2개만 선택해 1분 토의 후, 글쓰기 과제로 연결합니다.',
  ];
}

function generateAchievementStandards(subject: string, gradeLevel: string) {
  const standards = {
    '국어': '관련 성취기준(요약)\n(하긴 필요) 관련 성취기준(요약)\n핵심 키워드',
    '사회': '사회적 가치와 규범 이해\n공동체 의식 함양',
    '도덕': '도덕적 가치 판단 능력\n타인 존중과 배려',
    '역사': '역사적 사건과 인물 이해\n시대적 배경 파악',
    '영어': 'Communicative competence\nReal-life situation practice',
  };

  return {
    subject: subject,
    standard: standards[subject] || standards['국어'],
  };
}

function generateClosingQuestions(topic: string): string[] {
  return [
    '(짧은 질문)\n[질문 예문] 대본의 갈등 해결 방식이 공정했는지 토의하고, 다른 해결안을 1가지 제안해 본다.',
  ];
}
