import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User as UserIcon, LogOut, Sparkles, Users, Clock, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, Zap, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Subject, ScriptFormData, GeneratedScript, CustomCharacter } from '../App';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { projectId } from '/utils/supabase/info';

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

  // 캐릭터 count 변경 시 목록 동기화 (기본 설정 인원수와 연동)
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

  const handleTopicClick = (topic: string) => {
    setFormData({ ...formData, topic, topicGeneratedByAI: false });
  };

  const handleGenerateTopic = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const token = user?.accessToken;
    if (!token) {
      toast.error('로그인이 만료되었습니다.', { description: '다시 로그인해 주세요.' });
      return;
    }

    setIsGeneratingTopic(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b937296/generate-topic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          gradeLevel: formData.gradeLevel,
        }),
      });

      if (response.status === 401) {
        toast.error('로그인이 만료되었습니다.', { description: '다시 로그인해 주세요.' });
        setIsGeneratingTopic(false);
        return;
      }

      if (!response.ok) {
        let errMsg = '알 수 없는 오류';
        try {
          const errorData = await response.json();
          errMsg = errorData?.error || errMsg;
        } catch {
          errMsg = `서버 오류 (${response.status})`;
        }
        toast.error('주제 생성 실패', { description: errMsg });
        setIsGeneratingTopic(false);
        return;
      }

      const data = await response.json();
      setFormData({ ...formData, topic: data.topic, topicGeneratedByAI: true });
      toast.success('주제가 생성되었습니다!');
      setIsGeneratingTopic(false);
    } catch {
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
    if (!user.accessToken) {
      toast.error('로그인이 만료되었습니다.', { description: '다시 로그인해 주세요.' });
      return;
    }

    setIsGenerating(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3분 (대본 생성은 30~90초 소요 가능)

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b937296/generate-script`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, customCharacters: [] }),
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        toast.error('로그인이 만료되었습니다.', { description: '다시 로그인해 주세요.' });
        setIsGenerating(false);
        return;
      }
      if (response.status === 504) {
        toast.error('서버 응답 시간 초과', {
          description: '인원 수나 시간을 줄이거나 잠시 후 다시 시도해 주세요.',
        });
        setIsGenerating(false);
        return;
      }

      if (response.status === 422) {
        let errMsg = '품질 검증에 실패했어요. 인원을 15명 이하로 줄이거나 주제를 바꿔 다시 시도해 주세요.';
        try {
          const errorData = await response.json();
          if (errorData?.error) errMsg = errorData.error;
        } catch { /* use default */ }
        toast.error('대본 생성 실패', { description: errMsg });
        setIsGenerating(false);
        return;
      }

      if (!response.ok) {
        let errMsg = '알 수 없는 오류';
        try {
          const errorData = await response.json();
          errMsg = errorData?.error || errMsg;
        } catch {
          errMsg = `서버 오류 (${response.status})`;
        }
        toast.error('대본 생성 실패', { description: errMsg });
        setIsGenerating(false);
        return;
      }

      const data = await response.json();

      const script: GeneratedScript = {
        formData,
        ...data.script
      };

      toast.success('대본이 생성되었습니다!', {
        description: `${script.title} · ${script.characters.length}명 · ${script.dialogue.length}개 대사`,
      });
      setIsGenerating(false);
      onSubmit(script);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) {
        toast.error('요청 시간이 초과되었습니다.', {
          description: '인원 수나 시간을 줄이거나 잠시 후 다시 시도해 주세요.',
        });
      } else {
        toast.error('대본 생성 중 오류가 발생했습니다.', {
          description: '네트워크를 확인하거나 잠시 후 다시 시도해 주세요.',
        });
      }
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
                                const raw = e.target.value;
                                if (raw === '' || raw === '-') {
                                  setFormData(prev => ({ ...prev, groupSize: 1 }));
                                  return;
                                }
                                const parsed = parseInt(raw, 10);
                                if (!isNaN(parsed)) {
                                  const val = Math.min(30, Math.max(1, parsed));
                                  handleCountChange(val);
                                  setFormData(prev => ({ ...prev, groupSize: val }));
                                }
                              }}
                              onBlur={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                const val = isNaN(parsed) ? 1 : Math.min(30, Math.max(1, parsed));
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
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '' || raw === '-') {
                                  setFormData(prev => ({ ...prev, timeMinutes: 3 }));
                                  return;
                                }
                                const parsed = parseInt(raw, 10);
                                if (!isNaN(parsed)) {
                                  setFormData(prev => ({ ...prev, timeMinutes: parsed }));
                                }
                              }}
                              onBlur={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                const val = isNaN(parsed) ? 3 : Math.min(20, Math.max(3, parsed));
                                setFormData(prev => ({ ...prev, timeMinutes: val }));
                              }}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* 권장 안내 — 그리드 전체 가로로 넓게 */}
                        <div className="col-span-2 sm:col-span-3 mt-4 px-5 py-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 min-w-0">
                          <p className="font-semibold mb-1">💡 권장 설정</p>
                          <p className="text-[#047857] leading-relaxed">인원 <strong>15명 이하</strong>, 시간 <strong>10분 이하</strong>로 하면 생성이 빠르고 안정적이에요. 인원·시간이 크면 검증을 완화해 한 번만 생성합니다.</p>
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
                    {/* 역할 설정 탭 — 극에 맞는 역할/이름은 AI가 설정, 사용자는 인원수만 */}
                    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-[#1F2937]">역할은 AI가 극에 맞게 정해요</p>
                            <p className="text-xs text-[#6B7280] mt-0.5">대본 주제에 맞는 이름·직함을 자동으로 설정합니다</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-100 text-sm text-[#1F2937] leading-relaxed">
                          <p className="font-semibold text-[#7C3AED] mb-2">참여 인원수만 선택하세요</p>
                          <p className="text-[#6B7280]">위 <strong>기본 설정</strong> 탭에서 정한 인원수({formData.characterCount}명)만큼 등장인물이 만들어집니다. 생성된 대본 결과 화면에서, 원하면 <strong>학생 이름을 괄호 안에 추가</strong>할 수 있어요.</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100">
                          <span className="text-sm font-bold text-[#1F2937]">이번 대본 등장인물 수</span>
                          <span className="px-3 py-1 rounded-full bg-[#7C3AED] text-white text-sm font-bold">{formData.characterCount}명</span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] mt-3 text-center">인원 변경은 기본 설정 탭에서 해주세요</p>
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
                      <span className="font-semibold text-[#1F2937]">등장인물:</span> {formData.characterCount}명 (AI가 극에 맞게 설정)
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-white rounded-xl">
                    <div className="text-2xl font-bold text-[#7C3AED] mb-1">30초</div>
                    <div className="text-xs text-[#6B7280] font-semibold">평균 생성 시간</div>
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
