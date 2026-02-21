import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User as UserIcon, LogOut, Sparkles, Users, Clock, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, Zap, Wand2, Plus, Trash2, Pencil, Check, X, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { Subject, ScriptFormData, GeneratedScript, CustomCharacter } from '../App';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface ScriptFormProps {
  subject: Subject;
  onBack: () => void;
  onSubmit: (script: GeneratedScript) => void;
  user: { email: string; name: string; accessToken?: string } | null;
  onLogout: () => void;
}

const sampleTopics: Record<Subject, string[]> = {
  '국어': [
    '발표 시간에 말문이 막힌 아이',
    '일기장을 몰래 읽은 친구 사이의 오해',
    '거짓말이 들통난 독후감 사건',
    '받아쓰기 0점을 숨기려다 벌어진 일',
    '작문 시간, 친구 글을 베낀 사실이 드러나다',
    '짝꿍의 발표를 대신 나서준 그날',
    '토론 대회 전날 밤, 의견이 갈린 모둠',
    '편지 한 통으로 오해가 풀린 이야기',
  ],
  '사회': [
    '학급 회장 선거, 다수결의 함정',
    '전학 온 외국인 친구가 겪은 차별',
    '마을 공원 개발을 둘러싼 주민 갈등',
    '물건 값이 오른 학교 앞 문구점 사건',
    '환경 캠페인, 나 하나쯤이야 vs 우리 모두',
    '학급 신문사 기자가 된 아이들의 취재 갈등',
    '재난 대피 훈련 날, 규칙을 어긴 친구',
    '지역 축제 예산을 학급이 직접 결정하다',
  ],
  '도덕': [
    '친구의 시험 부정행위를 목격했을 때',
    '따돌림 현장에서 방관자가 된 그 순간',
    '내가 한 거짓말이 친구를 다치게 했다',
    '칭찬받고 싶어서 남의 작품을 내 것이라 했을 때',
    '온라인 게임 속 욕설, 용기 내어 말할 수 있을까',
    '길에서 지갑을 주웠을 때 생긴 고민',
    '인기 있는 친구에게 맞춰주다 나를 잃은 이야기',
    '비밀을 지켜달라는 친구, 하지만 위험한 비밀이라면',
  ],
  '역사': [
    '3·1운동 전날 밤, 학생들의 결의',
    '조선시대 신분제 속 천민 소년의 꿈',
    '6·25 피란길, 가족과 헤어진 하루',
    '임진왜란 당시 의병으로 나선 평범한 백성',
    '세종대왕과 집현전 학자들의 한글 창제 논쟁',
    '일제강점기, 독립운동 전단지를 숨겨야 했던 아이',
    '고려시대 무역항 벽란도에서 만난 외국 상인',
    '독도를 지키러 나선 조선 어부들의 이야기',
  ],
  '영어': [
    'My new friend is from another country',
    'Asking for directions to the library',
    'Ordering food at a school cafeteria',
    'Planning a class birthday party together',
    'Lost at the amusement park: asking for help',
    'Shopping for a present with a limited budget',
    'A sick day: calling the doctor\'s office',
    'Introducing my family to a foreign pen pal',
  ]
};

const gradeLevels = [
  { value: '3-4학년', label: '3-4학년' },
  { value: '5-6학년', label: '5-6학년' },
];

const subjectEmojis: Record<Subject, string> = {
  '국어': '📚',
  '사회': '🏛️',
  '도덕': '❤️',
  '역사': '⏳',
  '영어': '🌍',
};

const subjectColors: Record<Subject, { gradient: string; bg: string; border: string }> = {
  '국어': { gradient: 'from-pink-400 to-rose-400', bg: 'bg-pink-50', border: 'border-pink-300' },
  '사회': { gradient: 'from-blue-400 to-cyan-400', bg: 'bg-blue-50', border: 'border-blue-300' },
  '도덕': { gradient: 'from-purple-400 to-pink-400', bg: 'bg-purple-50', border: 'border-purple-300' },
  '역사': { gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', border: 'border-amber-300' },
  '영어': { gradient: 'from-indigo-400 to-purple-400', bg: 'bg-indigo-50', border: 'border-indigo-300' },
};

// 기본 역할명 생성 헬퍼
function makeDefaultChars(count: number): CustomCharacter[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `char-${Date.now()}-${i}`,
    number: i + 1,
    name: `등장인물 ${i + 1}`,
  }));
}

// 자동 이름 프리셋
const namePresets: { label: string; emoji: string; names: string[] }[] = [
  {
    label: '한국 학생 이름',
    emoji: '🧒',
    names: ['민준', '서연', '지호', '유진', '재원', '하은', '도현', '나영', '성민', '수아',
            '태양', '지아', '현우', '예린', '민서', '준혁', '소율', '동현', '채원', '시우',
            '건우', '지윤', '하준', '서현', '민재', '예나', '우진', '다은', '진우', '혜리'],
  },
  {
    label: '역할/직함',
    emoji: '🎭',
    names: ['나레이터', '선생님', '학생 1', '학생 2', '학생 3', '반장', '부반장', '전학생',
            '학부모', '교장선생님', '친구 A', '친구 B', '친구 C', '이웃', '가게 주인',
            '경찰관', '의사', '기자', '시장', '할머니', '할아버지', '형', '언니', '동생', '엄마',
            '아빠', '코치', '심판', '관객', '사회자'],
  },
  {
    label: '역사 인물풍',
    emoji: '⚔️',
    names: ['백성 갑', '백성 을', '양반 어르신', '선비', '왕', '신하', '장군', '병사',
            '상인', '농부', '어부', '스님', '궁녀', '내관', '이방', '포졸', '의원',
            '학동', '훈장', '향리', '감사', '원님', '사또', '봉이', '홍이', '돌쇠', '막동',
            '분이', '순이'],
  },
  {
    label: '영어 이름',
    emoji: '🌍',
    names: ['Minjun', 'Soyeon', 'Jake', 'Emma', 'Junho', 'Lily', 'Tom', 'Anna',
            'Kevin', 'Mia', 'Daniel', 'Grace', 'Chris', 'Jenny', 'Sam', 'Amy',
            'Teacher Kim', 'Narrator', 'Student A', 'Student B', 'Student C',
            'Shop Owner', 'Doctor', 'Parent', 'Friend 1', 'Friend 2',
            'Classmate', 'Principal', 'Librarian', 'Coach'],
  },
];

export function ScriptForm({ subject, onBack, onSubmit, user, onLogout }: ScriptFormProps) {
  const [formData, setFormData] = useState<ScriptFormData>({
    subject,
    topic: '',
    topicGeneratedByAI: false,
    gradeLevel: '3-4학년',
    groupSize: 5,
    timeMinutes: 5,
    characterCount: 5,
    customCharacters: makeDefaultChars(5),
    includeDiscussionLeader: false,
    includeStudentTeacherLayout: true,
    includeAchievementStandards: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'characters'>('settings');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const presetMenuRef = useRef<HTMLDivElement>(null);

  // 프리셋 메뉴 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(e.target as Node)) {
        setShowPresetMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 프리셋 자동 적용
  const handleApplyPreset = (preset: typeof namePresets[number]) => {
    setFormData(prev => ({
      ...prev,
      customCharacters: prev.customCharacters.map((char, i) => ({
        ...char,
        name: preset.names[i] ?? char.name,
      })),
    }));
    setShowPresetMenu(false);
    toast.success(`'${preset.label}' 이름이 적용되었습니다!`);
  };

  // 이름 초기화
  const handleResetNames = () => {
    setFormData(prev => ({
      ...prev,
      customCharacters: prev.customCharacters.map((char, i) => ({
        ...char,
        name: `등장인물 ${i + 1}`,
      })),
    }));
    setShowPresetMenu(false);
    toast.success('이름이 초기화되었습니다.');
  };

  // ── 캐릭터 count 변경 시 목록 동기화 ──────────────────────────
  const syncCharacters = useCallback((newCount: number, prev: CustomCharacter[]) => {
    if (newCount > prev.length) {
      const extra = Array.from({ length: newCount - prev.length }, (_, i) => ({
        id: `char-${Date.now()}-${i}`,
        number: prev.length + i + 1,
        name: `등장인물 ${prev.length + i + 1}`,
      }));
      return [...prev, ...extra];
    }
    return prev.slice(0, newCount).map((c, i) => ({ ...c, number: i + 1 }));
  }, []);

  const handleCountChange = (newCount: number) => {
    const clamped = Math.min(30, Math.max(1, newCount));
    setFormData(prev => ({
      ...prev,
      characterCount: clamped,
      customCharacters: syncCharacters(clamped, prev.customCharacters),
    }));
  };

  const handleAddCharacter = () => {
    if (formData.customCharacters.length >= 30) return;
    const newNum = formData.customCharacters.length + 1;
    const newChar: CustomCharacter = {
      id: `char-${Date.now()}`,
      number: newNum,
      name: `등장인물 ${newNum}`,
    };
    setFormData(prev => ({
      ...prev,
      characterCount: prev.customCharacters.length + 1,
      customCharacters: [...prev.customCharacters, newChar],
    }));
  };

  const handleDeleteCharacter = (id: string) => {
    setFormData(prev => {
      const filtered = prev.customCharacters.filter(c => c.id !== id)
        .map((c, i) => ({ ...c, number: i + 1 }));
      return { ...prev, characterCount: filtered.length, customCharacters: filtered };
    });
  };

  const handleStartEdit = (char: CustomCharacter) => {
    setEditingId(char.id);
    setEditingName(char.name);
  };

  const handleConfirmEdit = () => {
    if (!editingId) return;
    setFormData(prev => ({
      ...prev,
      customCharacters: prev.customCharacters.map(c =>
        c.id === editingId ? { ...c, name: editingName.trim() || c.name } : c
      ),
    }));
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleTopicClick = (topic: string) => {
    setFormData({ ...formData, topic, topicGeneratedByAI: false });
  };

  const handleGenerateTopic = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsGeneratingTopic(true);

    try {
      console.log('Generating topic with AI...');
      
      const authToken = user.accessToken || publicAnonKey;
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b937296/generate-topic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          gradeLevel: formData.gradeLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Generate topic error:', errorData);
        toast.error('주제 생성 실패', {
          description: errorData.error || '알 수 없는 오류',
        });
        setIsGeneratingTopic(false);
        return;
      }

      const data = await response.json();
      console.log('Topic generated successfully:', data.topic);

      setFormData({ ...formData, topic: data.topic, topicGeneratedByAI: true });
      toast.success('주제가 생성되었습니다!');
      setIsGeneratingTopic(false);
    } catch (error) {
      console.error('Generate topic error:', error);
      toast.error('주제 생성 중 오류가 발생했습니다.');
      setIsGeneratingTopic(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Calling generate script API...');
      
      const authToken = user.accessToken || publicAnonKey;
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b937296/generate-script`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Generate script error:', errorData);
        toast.error('대본 생성 실패', {
          description: errorData.error || '알 수 없는 오류',
        });
        setIsGenerating(false);
        return;
      }

      const data = await response.json();
      console.log('Script generated successfully');
      console.log('Generated script details:', {
        title: data.script.title,
        characterCount: data.script.characters?.length,
        dialogueCount: data.script.dialogue?.length,
        subject: formData.subject,
        timeMinutes: formData.timeMinutes,
      });

      // Create GeneratedScript object
      const script: GeneratedScript = {
        formData,
        ...data.script
      };

      // Validate script matches user requirements
      const validationIssues = [];
      if (script.characters.length !== formData.characterCount) {
        validationIssues.push(`등장인물 ${script.characters.length}명 (요청: ${formData.characterCount}명)`);
      }
      if (script.dialogue.length < formData.timeMinutes * 8) {
        validationIssues.push(`대사 ${script.dialogue.length}개 (권장: 최소 ${formData.timeMinutes * 8}개)`);
      }

      if (validationIssues.length > 0) {
        console.warn('Script validation warnings:', validationIssues);
      }

      toast.success('대본이 생성되었습니다!', {
        description: `${script.title}\n✅ ${script.characters.length}명 등장인물 | ${script.dialogue.length}개 대사 | ${formData.timeMinutes}분용`,
      });
      setIsGenerating(false);
      onSubmit(script);
    } catch (error) {
      console.error('Generate script error:', error);
      toast.error('대본 생성 중 오류가 발생했습니다.');
      setIsGenerating(false);
    }
  };

  const isFormValid = formData.topic.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#FEF9F3] relative overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-emerald-100/30"></div>
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-20 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-[#1F2937] font-semibold transition-all shadow-sm hover:shadow-md"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로 가기</span>
            </motion.button>

            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border-2 border-purple-200">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                  <UserIcon className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-sm font-semibold text-[#1F2937]">{user.name}</span>
                </div>
                <motion.button
                  onClick={onLogout}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 border-2 border-red-200 transition-all text-red-600"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-semibold">로그아웃</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content - Two Column Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form (60%) */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              {/* Subject Chip */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${subjectColors[subject].bg} border-2 ${subjectColors[subject].border} shadow-sm min-h-[44px]`}>
                  <span className="text-2xl">{subjectEmojis[subject]}</span>
                  <span className="text-lg font-bold text-[#1F2937]">{subject}</span>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-[#1F2937] mb-3 tracking-tight">
                대본 생성 설정
              </h2>
              <p className="text-lg text-[#6B7280] font-medium">
                학습 주제와 조건을 입력하면 AI가 맞춤 대본을 만들어드려요
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Topic Input */}
              <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-[#7C3AED]" />
                  <Label htmlFor="topic" className="text-base font-bold text-[#1F2937]">
                    학습 주제 <span className="text-red-500">*</span>
                  </Label>
                  {formData.topicGeneratedByAI && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-md"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI 생성</span>
                    </motion.div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value, topicGeneratedByAI: false })}
                    placeholder="예: 친구와의 갈등 해결하기"
                    className="flex-1"
                  />
                  <motion.button
                    type="button"
                    onClick={handleGenerateTopic}
                    disabled={isGeneratingTopic}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
                    whileHover={!isGeneratingTopic ? { scale: 1.05 } : {}}
                    whileTap={!isGeneratingTopic ? { scale: 0.95 } : {}}
                  >
                    {isGeneratingTopic ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-sm">생성중...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span className="text-sm">AI 생성</span>
                      </>
                    )}
                  </motion.button>
                </div>
                <p className="text-sm text-[#6B7280] mt-2 font-medium">
                  역할극에서 다룰 주제를 입력하거나, AI가 생성하거나, 아래에서 선택하세요
                </p>

                {/* Recommended Topics */}
                <div className="mt-4 p-4 bg-[#F3E4FF] rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-sm font-bold text-[#1F2937]">
                      추천 주제 ({sampleTopics[formData.subject].length}개)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {sampleTopics[formData.subject].map((topic, index) => (
                      <motion.button
                        key={index}
                        type="button"
                        onClick={() => handleTopicClick(topic)}
                        className="px-3 py-1.5 bg-white hover:bg-purple-50 text-[#1F2937] rounded-full text-xs font-semibold transition-all duration-300 border-2 border-gray-200 hover:border-purple-300 shadow-sm min-h-[32px]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {topic}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 탭 전환 */}
              <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md bg-white">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-3 text-sm font-bold transition-all duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white shadow-inner'
                      : 'text-[#6B7280] hover:bg-gray-50'
                  }`}
                >
                  ⚙️ 기본 설정
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('characters')}
                  className={`flex-1 py-3 text-sm font-bold transition-all duration-200 relative ${
                    activeTab === 'characters'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white shadow-inner'
                      : 'text-[#6B7280] hover:bg-gray-50'
                  }`}
                >
                  🎭 역할 설정
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/30 text-xs font-bold">
                    {formData.customCharacters.length}
                  </span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'settings' ? (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Grid: Grade / Group Size / Time / Character Count */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-200">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {/* Grade Level */}
                        <div>
                          <Label htmlFor="gradeLevel" className="text-sm font-bold text-[#1F2937] mb-2 block">
                            학년
                          </Label>
                          <Select value={formData.gradeLevel} onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Group Size */}
                        <div>
                          <Label htmlFor="groupSize" className="text-sm font-bold text-[#1F2937] mb-2 block">
                            인원수 (1-30명)
                          </Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none z-10" />
                            <Input
                              id="groupSize"
                              type="number"
                              min={1}
                              max={30}
                              value={formData.groupSize}
                              onChange={(e) => {
                                const val = Math.min(30, Math.max(1, parseInt(e.target.value) || 1));
                                handleCountChange(val);
                                setFormData(prev => ({ ...prev, groupSize: val }));
                              }}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* Time */}
                        <div>
                          <Label htmlFor="timeMinutes" className="text-sm font-bold text-[#1F2937] mb-2 block">
                            시간 (3-20분)
                          </Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none z-10" />
                            <Input
                              id="timeMinutes"
                              type="number"
                              min={3}
                              max={20}
                              value={formData.timeMinutes}
                              onChange={(e) => setFormData(prev => ({ ...prev, timeMinutes: Math.min(20, Math.max(3, parseInt(e.target.value) || 3)) }))}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="characters"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* 역할 설정 탭 */}
                    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-bold text-[#1F2937]">역할 이름 직접 설정</p>
                            <p className="text-xs text-[#6B7280] mt-0.5">이름을 클릭하여 수정하거나 자동 설정을 사용해요</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-purple-100 text-[#7C3AED] text-xs font-bold border border-purple-200">
                            {formData.customCharacters.length} / 30
                          </span>
                        </div>

                        {/* 자동 설정 버튼 */}
                        <div className="relative" ref={presetMenuRef}>
                          <button
                            type="button"
                            onClick={() => setShowPresetMenu(prev => !prev)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-[#7C3AED] text-sm font-bold transition-all shadow-sm"
                          >
                            <Shuffle className="w-4 h-4" />
                            <span>이름 자동 설정</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPresetMenu ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showPresetMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-purple-200 shadow-xl z-30 overflow-hidden"
                              >
                                <div className="p-2">
                                  {namePresets.map((preset) => (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() => handleApplyPreset(preset)}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                                    >
                                      <span className="text-xl">{preset.emoji}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#1F2937] group-hover:text-[#7C3AED] transition-colors">
                                          {preset.label}
                                        </p>
                                        <p className="text-xs text-[#9CA3AF] truncate">
                                          {preset.names.slice(0, 5).join(', ')}...
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                  <div className="border-t border-gray-100 mt-1 pt-1">
                                    <button
                                      type="button"
                                      onClick={handleResetNames}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all text-left"
                                    >
                                      <span className="text-xl">🔄</span>
                                      <p className="text-sm font-bold text-[#EF4444]">이름 초기화</p>
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                        <AnimatePresence>
                          {formData.customCharacters.map((char) => (
                            <motion.div
                              key={char.id}
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.15 }}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all group ${
                                editingId === char.id
                                  ? 'border-[#7C3AED] bg-purple-50'
                                  : 'border-gray-100 hover:border-purple-200 bg-gray-50 hover:bg-purple-50'
                              }`}
                            >
                              {/* 번호 뱃지 */}
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white text-xs font-bold flex items-center justify-center">
                                {char.number}
                              </div>

                              {/* 이름 (편집 or 표시) - 클릭 시 바로 편집 */}
                              {editingId === char.id ? (
                                <input
                                  autoFocus
                                  className="flex-1 text-sm font-semibold text-[#1F2937] bg-white border-2 border-[#7C3AED] rounded-lg px-2 py-1 outline-none"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  maxLength={20}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(char)}
                                  className="flex-1 text-left text-sm font-semibold text-[#1F2937] truncate flex items-center gap-1.5 group/name"
                                  title="클릭하여 이름 수정"
                                >
                                  <span className="truncate">{char.name}</span>
                                  <Pencil className="w-3 h-3 text-[#C4B5FD] opacity-0 group-hover/name:opacity-100 flex-shrink-0 transition-opacity" />
                                </button>
                              )}

                              {/* 확인/취소 or 삭제 버튼 */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {editingId === char.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={handleConfirmEdit}
                                      className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-all"
                                      title="확인 (Enter)"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEdit}
                                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all"
                                      title="취소 (Esc)"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCharacter(char.id)}
                                    disabled={formData.customCharacters.length <= 1}
                                    className="w-7 h-7 rounded-lg bg-transparent hover:bg-red-100 text-gray-300 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* 역할 추가 버튼 */}
                      <div className="p-3 border-t-2 border-gray-100">
                        <button
                          type="button"
                          onClick={handleAddCharacter}
                          disabled={formData.customCharacters.length >= 30}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 text-[#7C3AED] text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                          역할 추가
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Advanced Options - Accordion */}
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all duration-300 min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#FBBF24]" />
                    <span className="text-base font-bold text-[#1F2937]">추가 옵션</span>
                  </div>
                  {showAdvancedOptions ? (
                    <ChevronUp className="w-5 h-5 text-[#6B7280]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#6B7280]" />
                  )}
                </button>

                {showAdvancedOptions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="px-6 pb-6 pt-4 space-y-2 border-t-2 border-gray-100"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 min-h-[44px]">
                      <Checkbox
                        id="discussionLeader"
                        checked={formData.includeDiscussionLeader}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeDiscussionLeader: checked as boolean })}
                      />
                      <Label htmlFor="discussionLeader" className="cursor-pointer text-sm font-semibold text-[#1F2937]">
                        토의/글쓰기까지 이어지게 (옵션)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 min-h-[44px]">
                      <Checkbox
                        id="studentTeacherLayout"
                        checked={formData.includeStudentTeacherLayout}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeStudentTeacherLayout: checked as boolean })}
                      />
                      <Label htmlFor="studentTeacherLayout" className="cursor-pointer text-sm font-semibold text-[#1F2937]">
                        학생용/교사용 2단 구성
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 min-h-[44px]">
                      <Checkbox
                        id="achievementStandards"
                        checked={formData.includeAchievementStandards}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeAchievementStandards: checked as boolean })}
                      />
                      <Label htmlFor="achievementStandards" className="cursor-pointer text-sm font-semibold text-[#1F2937]">
                        성취기준(근거) 함께 넣기
                      </Label>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: isFormValid ? 1.02 : 1 }} whileTap={{ scale: isFormValid ? 0.98 : 1 }}>
                <Button
                  type="submit"
                  disabled={!isFormValid || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-3">
                      <motion.div
                        className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      AI가 대본을 작성중이에요...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-6 h-6" />
                      AI 대본 생성하기
                    </span>
                  )}
                </Button>
              </motion.div>

              {!isFormValid && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-[#EF4444] font-semibold"
                >
                  ⚠️ 학습 주제를 입력해주세요
                </motion.p>
              )}
            </motion.form>
          </div>

          {/* Right: Preview/Help (40%) */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut', delay: 0.4 }}
              className="sticky top-24 space-y-6"
            >
              {/* Preview Card */}
              <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                  <h3 className="text-lg font-bold text-[#1F2937]">생성될 대본 미리보기</h3>
                </div>
                <div className="space-y-3 text-sm text-[#6B7280]">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2"></div>
                    <div>
                      <span className="font-semibold text-[#1F2937]">과목:</span> {subject}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2"></div>
                    <div>
                      <span className="font-semibold text-[#1F2937]">주제:</span>{' '}
                      {formData.topic || '(입력 대기 중)'}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2"></div>
                    <div>
                      <span className="font-semibold text-[#1F2937]">학년:</span> {formData.gradeLevel}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2"></div>
                    <div>
                      <span className="font-semibold text-[#1F2937]">구성:</span> 인원 {formData.groupSize}명 · {formData.timeMinutes}분 분량
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2"></div>
                    <div>
                      <span className="font-semibold text-[#1F2937]">등장인물:</span>{' '}
                      {formData.customCharacters.map(c => `${c.number}. ${c.name}`).join(' / ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-[#FBBF24]" />
                  <h3 className="text-lg font-bold text-[#1F2937]">💡 도움말</h3>
                </div>
                <ul className="space-y-2 text-sm text-[#6B7280] font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FBBF24] font-bold">•</span>
                    <span>주제는 구체적으로 입력할수록 좋아요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FBBF24] font-bold">•</span>
                    <span>추천 주제를 클릭하면 자동으로 입력돼요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FBBF24] font-bold">•</span>
                    <span>인원수와 등장인물 수를 맞추면 모두가 역할을 맡을 수 있어요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FBBF24] font-bold">•</span>
                    <span>생성 후 DOCX 파일로 다운로드 가능해요</span>
                  </li>
                </ul>
              </div>

              {/* Stats Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md">
                <h3 className="text-lg font-bold text-[#1F2937] mb-4">✨ 생성 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-xl">
                    <div className="text-2xl font-bold text-[#7C3AED] mb-1">30초</div>
                    <div className="text-xs text-[#6B7280] font-semibold">생성 시간</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl">
                    <div className="text-2xl font-bold text-[#10B981] mb-1">100%</div>
                    <div className="text-xs text-[#6B7280] font-semibold">맞춤 제작</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
