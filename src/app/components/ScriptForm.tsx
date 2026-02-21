import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, User as UserIcon, LogOut, Sparkles, Users, Clock, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, Zap, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Subject, ScriptFormData, GeneratedScript } from '../App';
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
    '갈등 대화 연습: 친구가 약속을 어겼을 때',
    '갈등 대화 연습: 단체팀에서 오해가 생겼을 때',
    '주장-근거 말하기: 스마트폰 사용 시간',
    '주장-근거 말하기: 숙제는 꼭 필요할까?',
    '토의/협의: 학교 규칙을 새로 만들기',
    '인물 인터뷰 대본: 세종대왕 인터뷰',
    '공감/상담 대화: 친구가 속상해할 때',
    '사과/화해 대화: 말로 상처를 줬을 때',
  ],
  '사회': [
    '민주 시민의 권리와 책임',
    '지역사회의 문제 해결',
    '경제 활동과 합리적 선택',
    '우리 지역의 역사와 문화',
  ],
  '도덕': [
    '가치·공감·배려를 대화로 연습',
    '정직의 중요성',
    '공정한 경쟁',
    '책임감 있는 행동',
  ],
  '역사': [
    '독립운동가 인터뷰',
    '역사적 사건 재현',
    '시대별 생활 모습',
    '인물·사건을 생생하게 이해',
  ],
  '영어': [
    'At the restaurant',
    'Shopping at the mall',
    'Making friends',
    'Asking for directions',
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

export function ScriptForm({ subject, onBack, onSubmit, user, onLogout }: ScriptFormProps) {
  const [formData, setFormData] = useState<ScriptFormData>({
    subject,
    topic: '',
    topicGeneratedByAI: false,
    gradeLevel: '3-4학년',
    groupSize: 5,
    timeMinutes: 5,
    characterCount: 5,
    includeDiscussionLeader: false,
    includeStudentTeacherLayout: true,
    includeAchievementStandards: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

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

              {/* Grid: Grade / Group Size / Time */}
              <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      인원수 (3-12명)
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none z-10" />
                      <Input
                        id="groupSize"
                        type="number"
                        min={3}
                        max={12}
                        value={formData.groupSize}
                        onChange={(e) => setFormData({ ...formData, groupSize: parseInt(e.target.value) || 3 })}
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
                        onChange={(e) => setFormData({ ...formData, timeMinutes: parseInt(e.target.value) || 3 })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                    className="px-6 pb-6 space-y-4 border-t-2 border-gray-100"
                  >
                    <div className="pt-4">
                      <Label htmlFor="characterCount" className="text-sm font-bold text-[#1F2937] mb-2 block">
                        등장인물 수 (3-12명)
                      </Label>
                      <Input
                        id="characterCount"
                        type="number"
                        min={3}
                        max={12}
                        value={formData.characterCount}
                        onChange={(e) => setFormData({ ...formData, characterCount: parseInt(e.target.value) || 3 })}
                      />
                    </div>

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
                      <span className="font-semibold text-[#1F2937]">구성:</span> {formData.groupSize}명, {formData.timeMinutes}분
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2"></div>
                    <div>
                      <span className="font-semibold text-[#1F2937]">등장인물:</span> {formData.characterCount}명
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
                    <span>인원수와 등장인물 수는 같거나 비슷하게 설정하세요</span>
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
