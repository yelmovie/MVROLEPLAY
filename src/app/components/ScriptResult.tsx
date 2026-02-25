import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Download, FileText, User as UserIcon, CheckCircle2, ChevronDown, ChevronUp, Sparkles, BookOpen, Users2, Film, GraduationCap, Award, MessageCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { GeneratedScript } from '../App';
import { useState } from 'react';
import { downloadScriptAsPDF } from '../../utils/downloadPDF';
import { downloadScriptAsDOCX } from '../../utils/downloadDOCX';

interface ScriptResultProps {
  script: GeneratedScript;
  onBack: () => void;
  onNewScript: () => void;
  user: { email: string; name: string } | null;
  onLogout: () => void;
}

// Character colors
const characterColors = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', bubble: 'bg-blue-50' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700', bubble: 'bg-pink-50' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', bubble: 'bg-purple-50' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', bubble: 'bg-emerald-50' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', bubble: 'bg-amber-50' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', bubble: 'bg-cyan-50' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', bubble: 'bg-rose-50' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-700', bubble: 'bg-indigo-50' },
];

export function ScriptResult({ script, onBack, onNewScript, user, onLogout }: ScriptResultProps) {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  /** null: 아직 안 물음, 'yes': 괄호 안 이름 추가함, 'no': 추가 안 함 */
  const [studentNamesChoice, setStudentNamesChoice] = useState<null | 'yes' | 'no'>(null);
  /** (1),(2),(3)에 대응하는 학생 이름. choice === 'yes'일 때만 사용 */
  const [studentNames, setStudentNames] = useState<string[]>(() =>
    Array(script.characters?.length ?? 0).fill('')
  );
  const [expandedSections, setExpandedSections] = useState({
    situation: true,
    characters: false,
    dialogue: true,
    teachingPoints: false,
    achievementStandards: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDownloadDOCX = async () => {
    if (isDownloadingDOCX) return;
    setIsDownloadingDOCX(true);
    const id = toast.loading('DOCX 파일 생성 중...');
    try {
      await downloadScriptAsDOCX(script);
      toast.success('DOCX 다운로드 완료!', { id });
    } catch (e) {
      toast.error('DOCX 다운로드 실패. 다시 시도해 주세요.', { id });
    } finally {
      setIsDownloadingDOCX(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isDownloadingPDF) return;
    setIsDownloadingPDF(true);
    const id = toast.loading('PDF 파일 생성 중...');
    try {
      await downloadScriptAsPDF(script);
      toast.success('PDF 다운로드 완료!', { id });
    } catch (e) {
      toast.error('PDF 다운로드 실패. 다시 시도해 주세요.', { id });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Assign colors to characters
  const characterColorMap = new Map<string, typeof characterColors[0]>();
  script.characters.forEach((char, index) => {
    characterColorMap.set(char.name, characterColors[index % characterColors.length]);
  });

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
              <span>수정하기</span>
            </motion.button>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border-2 border-purple-200">
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
                </>
              ) : null}
              <motion.button
                onClick={onNewScript}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white font-semibold transition-all shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                새로 만들기
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Success Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
            <span className="text-lg font-bold text-[#1F2937]">대본 생성 완료!</span>
          </div>
        </motion.div>

        {/* Info Chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut', delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          <div className="px-4 py-2 rounded-full bg-[#F3E4FF] border-2 border-purple-200 text-sm font-semibold text-[#1F2937] min-h-[44px] flex items-center">
            📚 {script.formData.subject}
          </div>
          <div className="px-4 py-2 rounded-full bg-blue-50 border-2 border-blue-200 text-sm font-semibold text-[#1F2937] min-h-[44px] flex items-center gap-2">
            <span>🎯 {script.formData.topic}</span>
            {script.formData.topicGeneratedByAI && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>
          <div className="px-4 py-2 rounded-full bg-amber-50 border-2 border-amber-200 text-sm font-semibold text-[#1F2937] min-h-[44px] flex items-center">
            🎓 {script.formData.gradeLevel}
          </div>
          <div className="px-4 py-2 rounded-full bg-rose-50 border-2 border-rose-200 text-sm font-semibold text-[#1F2937] min-h-[44px] flex items-center">
            ⏱️ {script.formData.timeMinutes}분
          </div>
          <div className="px-4 py-2 rounded-full bg-emerald-50 border-2 border-emerald-200 text-sm font-semibold text-[#1F2937] min-h-[44px] flex items-center">
            👥 {script.formData.characterCount}명
          </div>
        </motion.div>

        {/* 학생 이름 괄호 추가 여부 질문 */}
        {studentNamesChoice === null && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl shadow-md border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50"
          >
            <p className="text-base font-bold text-[#1F2937] mb-4">학생 이름을 괄호 안에 추가로 표시할까요?</p>
            <p className="text-sm text-[#6B7280] mb-5">역할은 AI가 정해 두었어요. 원하면 각 역할에 맞는 학생 이름을 입력해 두면, 교사용 참고 목록으로 볼 수 있어요.</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setStudentNamesChoice('yes');
                  setStudentNames(Array(script.characters?.length ?? 0).fill(''));
                }}
                className="px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold shadow-md transition-all"
              >
                예, 추가할게요
              </button>
              <button
                type="button"
                onClick={() => setStudentNamesChoice('no')}
                className="px-6 py-3 rounded-xl bg-white border-2 border-gray-300 hover:border-gray-400 text-[#1F2937] font-bold transition-all"
              >
                아니오, 괜찮아요
              </button>
            </div>
          </motion.div>
        )}

        {/* 학생 이름 괄호 입력 (예 선택 시) */}
        {studentNamesChoice === 'yes' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden shadow-md"
          >
            <div className="p-4 border-b-2 border-amber-200 bg-amber-100/80">
              <h3 className="text-lg font-bold text-amber-800">📋 교사용 참고: 학생 이름 (괄호에 표시)</h3>
              <p className="text-sm text-amber-700 mt-1">각 역할 번호에 맞는 학생 이름을 입력하세요. 대본 본문에는 (1), (2), (3)…만 있고, 아래 목록으로 누가 누구인지 확인할 수 있어요.</p>
            </div>
            <div className="p-4 space-y-3">
              {script.characters.map((char, i) => (
                <div key={char.name} className="flex items-center gap-3 flex-wrap">
                  <span className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {char.name}
                  </span>
                  <input
                    type="text"
                    placeholder="학생 이름 입력"
                    value={studentNames[i] ?? ''}
                    onChange={(e) => {
                      const next = [...studentNames];
                      next[i] = e.target.value.slice(0, 20);
                      setStudentNames(next);
                    }}
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border-2 border-amber-200 bg-white text-[#1F2937] font-medium placeholder:text-gray-400"
                  />
                </div>
              ))}
            </div>
            <div className="p-4 pt-0 flex flex-wrap gap-2">
              <span className="text-sm font-bold text-amber-800 mr-2">매칭:</span>
              {script.characters.map((char, i) => (
                <span key={char.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-amber-300 text-sm font-semibold text-[#1F2937]">
                  <span className="text-amber-600">{char.name}</span>
                  <span>{studentNames[i]?.trim() || '(빈칸)'}</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Title and Download */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1F2937] mb-6 tracking-tight leading-tight">
            {script.title}
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <motion.button
              type="button"
              onClick={handleDownloadDOCX}
              disabled={isDownloadingDOCX}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-bold shadow-lg shadow-purple-300/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              whileHover={!isDownloadingDOCX ? { scale: 1.05, boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.4)" } : {}}
              whileTap={!isDownloadingDOCX ? { scale: 0.95 } : {}}
            >
              <Download className="w-5 h-5" />
              <span>{isDownloadingDOCX ? '생성 중...' : 'DOCX 다운로드'}</span>
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold shadow-lg shadow-emerald-300/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              whileHover={!isDownloadingPDF ? { scale: 1.05, boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.4)" } : {}}
              whileTap={!isDownloadingPDF ? { scale: 0.95 } : {}}
            >
              <FileText className="w-5 h-5" />
              <span>{isDownloadingPDF ? '생성 중...' : 'PDF 다운로드'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Accordion Sections */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4"
        >
          {/* 1. Situation and Role */}
          <Section
            icon={<BookOpen className="w-6 h-6" />}
            title="📋 상황 및 역할 설명"
            expanded={expandedSections.situation}
            onToggle={() => toggleSection('situation')}
            defaultOpen
          >
            <p className="text-[#1F2937] leading-relaxed font-medium text-base">
              {script.situationAndRole}
            </p>
          </Section>

          {/* 교사용 참고: 추천 이름 목록 — 본문에는 (1)(2)(3)만, 이름은 이 섹션으로만 */}
          {script.recommendedNamesForTeacher && script.recommendedNamesForTeacher.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden shadow-md">
              <div className="p-4 border-b-2 border-amber-200 bg-amber-100/80">
                <h3 className="text-lg font-bold text-amber-800">📋 교사용 참고: 추천 이름 목록</h3>
                <p className="text-sm text-amber-700 mt-1">대본 본문에는 (1), (2), (3)…만 표기됩니다. 아래 이름을 배역에 맞게 할당해 사용하세요.</p>
              </div>
              <div className="p-4 flex flex-wrap gap-3">
                {script.recommendedNamesForTeacher.map((name, i) => (
                  <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-amber-300 text-sm font-semibold text-[#1F2937]">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">{(i + 1)}</span>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Characters */}
          <Section
            icon={<Users2 className="w-6 h-6" />}
            title="👥 등장인물"
            expanded={expandedSections.characters}
            onToggle={() => toggleSection('characters')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {script.characters.map((character, index) => {
                const color = characterColorMap.get(character.name) || characterColors[0];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-5 rounded-2xl ${color.bubble} border-2 ${color.border} shadow-sm hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                        {index + 1}
                      </div>
                      <div className={`px-3 py-1.5 ${color.bg} rounded-full border-2 ${color.border}`}>
                        <span className={`font-bold ${color.text} text-sm`}>{character.name}</span>
                      </div>
                    </div>
                    <p className="text-[#1F2937] mt-3 font-medium text-sm leading-relaxed">
                      {character.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </Section>

          {/* 4. Dialogue */}
          <Section
            icon={<Film className="w-6 h-6" />}
            title="🎬 대본 내용"
            expanded={expandedSections.dialogue}
            onToggle={() => toggleSection('dialogue')}
            defaultOpen
          >
            <div className="space-y-4">
              {/* Opening Scene */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300">
                <p className="text-sm font-bold text-[#6B7280] mb-2">[장면 시작]</p>
                <p className="text-sm text-[#1F2937] italic font-medium">
                  (교실 복도에서 등장인물들이 대화를 나누고 있음)
                </p>
              </div>

              {/* Dialogue Lines - Speech Bubbles + Act Labels */}
              {(() => {
                const actColors: Record<string, string> = {
                  '도입': 'from-sky-50 to-blue-50 border-sky-300 text-sky-700',
                  '전개': 'from-amber-50 to-orange-50 border-amber-300 text-amber-700',
                  '절정': 'from-rose-50 to-red-50 border-rose-300 text-rose-700',
                  '결말': 'from-emerald-50 to-green-50 border-emerald-300 text-emerald-700',
                };
                const actEmoji: Record<string, string> = {
                  '도입': '🌱',
                  '전개': '🌊',
                  '절정': '⚡',
                  '결말': '🌈',
                };

                return script.dialogue.map((line, index) => {
                  // 막 구분 레이블 처리
                  const isActLabel = line.character === '📍장면';
                  if (isActLabel) {
                    const actKey = Object.keys(actColors).find(k => line.line.includes(k)) || '';
                    const colorClass = actColors[actKey] || 'from-gray-50 to-gray-100 border-gray-300 text-gray-700';
                    const emoji = actEmoji[actKey] || '📍';
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scaleX: 0.85 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r border-2 my-2 ${colorClass}`}
                      >
                        <span className="text-lg">{emoji}</span>
                        <span className="text-sm font-bold tracking-wide">{line.line}</span>
                      </motion.div>
                    );
                  }

                  // 일반 대사
                  const color = characterColorMap.get(line.character) || characterColors[0];
                  const isEven = index % 2 === 0;
                  const charIdx = script.characters.findIndex(c => c.name === line.character);
                  const charNum = charIdx >= 0 ? charIdx + 1 : null;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 1) }}
                      className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] ${isEven ? 'items-start' : 'items-end'} flex flex-col gap-1.5`}>
                        <div className={`flex items-center gap-1.5 ${isEven ? '' : 'flex-row-reverse'}`}>
                          {charNum && (
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {charNum}
                            </span>
                          )}
                          <span className={`text-xs font-bold ${color.text}`}>
                            {line.character}
                          </span>
                        </div>
                        <div className={`p-4 rounded-2xl ${color.bubble} border-2 ${color.border} shadow-sm`}>
                          <p className="text-[#1F2937] font-medium leading-relaxed">
                            {line.line}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </Section>

          {/* 5. Teaching Guide */}
          <Section
            icon={<GraduationCap className="w-6 h-6" />}
            title="📝 수업 가이드"
            expanded={expandedSections.teachingPoints}
            onToggle={() => toggleSection('teachingPoints')}
          >
            <div className="space-y-4">
              <h4 className="font-bold text-[#1F2937] mb-4">수업 포인트</h4>
              {script.teachingPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-50 border-2 border-yellow-300"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FBBF24] text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-[#1F2937] flex-1 font-medium leading-relaxed">{point}</p>
                </motion.div>
              ))}

              <h4 className="font-bold text-[#1F2937] mt-8 mb-4">교사용 지도 팁</h4>
              {script.teacherTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50 border-2 border-orange-300"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FB923C] text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-[#1F2937] flex-1 font-medium leading-relaxed">{tip}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* 6. Achievement Standards */}
          {script.formData.includeAchievementStandards && (
            <Section
              icon={<Award className="w-6 h-6" />}
              title="✅ 성취기준"
              expanded={expandedSections.achievementStandards}
              onToggle={() => toggleSection('achievementStandards')}
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-indigo-100 border-2 border-indigo-300 rounded-full text-sm font-bold text-indigo-700">
                    {script.achievementStandards.subject}
                  </span>
                </div>
                <p className="text-[#1F2937] leading-relaxed font-medium whitespace-pre-line">
                  {script.achievementStandards.standard}
                </p>
              </div>

              <div className="mt-6">
                <h4 className="font-bold text-[#1F2937] mb-4">평가 루브릭 (예시)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-gray-300 rounded-2xl overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
                        <th className="px-4 py-3 text-left font-bold text-[#1F2937] border-b-2 border-gray-300">평가 항목</th>
                        <th className="px-4 py-3 text-left font-bold text-[#1F2937] border-b-2 border-gray-300">우수</th>
                        <th className="px-4 py-3 text-left font-bold text-[#1F2937] border-b-2 border-gray-300">보통</th>
                        <th className="px-4 py-3 text-left font-bold text-[#1F2937] border-b-2 border-gray-300">노력 필요</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-4 py-3 font-semibold text-[#1F2937] border-b border-gray-200">역할 이해도</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] border-b border-gray-200">완벽히 이해</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] border-b border-gray-200">대체로 이해</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] border-b border-gray-200">추가 연습 필요</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-[#1F2937] border-b border-gray-200">표현력</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] border-b border-gray-200">생생하고 자연스러움</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] border-b border-gray-200">적절함</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] border-b border-gray-200">개선 필요</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-4 py-3 font-semibold text-[#1F2937]">협력 태도</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280]">적극적 참여</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280]">보통</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280]">소극적</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Section>
          )}

          {/* Closing Questions */}
          <div className="mt-6 p-6 rounded-3xl bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-300">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-[#EC4899]" />
              <h4 className="font-bold text-[#1F2937]">마무리 질문</h4>
            </div>
            <div className="space-y-3">
              {script.closingQuestions.map((question, index) => (
                <div key={index} className="p-4 rounded-xl bg-white border-2 border-pink-200">
                  <p className="text-[#1F2937] font-medium">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 text-center"
        >
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5 text-[#10B981]" />
            <p className="text-sm font-semibold text-[#1F2937]">
              생성 완료 · AI가 {script.formData.subject} 과목에 최적화된 대본을 만들었습니다
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ icon, title, expanded, onToggle, children, defaultOpen }: SectionProps) {
  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-all duration-300 min-h-[64px]"
      >
        <div className="flex items-center gap-3">
          <div className="text-[#7C3AED]">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-[#1F2937]">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {expanded ? (
            <ChevronUp className="w-6 h-6 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-6 h-6 text-[#6B7280]" />
          )}
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
