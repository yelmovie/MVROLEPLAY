import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Subject } from '../App';

interface SubjectSelectProps {
  onBack: () => void;
  onNext: (subject: Subject) => void;
}

const subjects = [
  {
    id: '국어' as Subject,
    title: '국어',
    description: '말하기·듣기·읽기·쓰기를 역할극으로',
    emoji: '📚',
    gradient: 'from-pink-400 to-rose-400',
  },
  {
    id: '사회' as Subject,
    title: '사회',
    description: '우리 사회의 규칙과 공동체를 탐구',
    emoji: '🏛️',
    gradient: 'from-blue-400 to-cyan-400',
  },
  {
    id: '도덕' as Subject,
    title: '도덕',
    description: '가치·공감·배려를 대화로 연습',
    emoji: '❤️',
    gradient: 'from-purple-400 to-pink-400',
  },
  {
    id: '역사' as Subject,
    title: '역사',
    description: '인물·사건을 생생하게 이해',
    emoji: '⏳',
    gradient: 'from-amber-400 to-orange-400',
  },
  {
    id: '영어' as Subject,
    title: '영어',
    description: '실생활 의사소통을 역할극으로',
    emoji: '🌍',
    gradient: 'from-indigo-400 to-purple-400',
  },
];

export function SubjectSelect({ onBack, onNext }: SubjectSelectProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const handleNext = () => {
    if (selectedSubject) {
      onNext(selectedSubject);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEF9F3] relative overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-emerald-100/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Back Button */}
        <motion.button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-[#1F2937] font-semibold transition-all shadow-sm hover:shadow-md"
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로 가기</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1F2937] mb-4 tracking-tight">
            어떤 과목을 준비하시나요?
          </h2>
          <p className="text-lg text-[#6B7280] font-medium">
            역할극 대본을 만들 과목을 선택해주세요
          </p>
        </motion.div>

        {/* Subject Grid - 2-3-2 Layout */}
        <div className="max-w-5xl mx-auto mb-12">
          {/* First Row - 2 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center mb-6">
            {subjects.slice(0, 2).map((subject, index) => (
              <motion.button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative w-full max-w-[280px] h-[320px] p-6 rounded-3xl 
                  bg-white border-2 shadow-lg
                  transition-all duration-300
                  ${
                    selectedSubject === subject.id
                      ? 'border-[#7C3AED] border-[3px] bg-[#F3E8FF] shadow-xl shadow-purple-200/50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
                  }
                `}
              >
                {/* Check Mark */}
                {selectedSubject === subject.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{
                      y: selectedSubject === subject.id ? [0, -5, 0] : 0,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: selectedSubject === subject.id ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                    className="text-[80px] leading-none"
                  >
                    {subject.emoji}
                  </motion.div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-[#1F2937] mb-3 text-center">
                  {subject.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#6B7280] leading-relaxed text-center font-medium mb-6">
                  {subject.description}
                </p>

                {/* Select Button */}
                <div className={`
                  flex items-center justify-center gap-2 px-4 py-2.5 rounded-full 
                  font-bold text-sm transition-all
                  ${
                    selectedSubject === subject.id
                      ? `bg-gradient-to-r ${subject.gradient} text-white shadow-md`
                      : 'bg-gray-100 text-[#6B7280] group-hover:bg-gray-200'
                  }
                `}>
                  <span>{selectedSubject === subject.id ? '선택됨' : '선택하기'}</span>
                  {selectedSubject !== subject.id && <ArrowRight className="w-4 h-4" />}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Second Row - 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {subjects.slice(2).map((subject, index) => (
              <motion.button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index + 2) * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative w-full max-w-[280px] h-[320px] p-6 rounded-3xl 
                  bg-white border-2 shadow-lg
                  transition-all duration-300
                  ${
                    selectedSubject === subject.id
                      ? 'border-[#7C3AED] border-[3px] bg-[#F3E8FF] shadow-xl shadow-purple-200/50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
                  }
                `}
              >
                {/* Check Mark */}
                {selectedSubject === subject.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{
                      y: selectedSubject === subject.id ? [0, -5, 0] : 0,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: selectedSubject === subject.id ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                    className="text-[80px] leading-none"
                  >
                    {subject.emoji}
                  </motion.div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-[#1F2937] mb-3 text-center">
                  {subject.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#6B7280] leading-relaxed text-center font-medium mb-6">
                  {subject.description}
                </p>

                {/* Select Button */}
                <div className={`
                  flex items-center justify-center gap-2 px-4 py-2.5 rounded-full 
                  font-bold text-sm transition-all
                  ${
                    selectedSubject === subject.id
                      ? `bg-gradient-to-r ${subject.gradient} text-white shadow-md`
                      : 'bg-gray-100 text-[#6B7280] group-hover:bg-gray-200'
                  }
                `}>
                  <span>{selectedSubject === subject.id ? '선택됨' : '선택하기'}</span>
                  {selectedSubject !== subject.id && <ArrowRight className="w-4 h-4" />}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center"
        >
          <motion.button
            onClick={handleNext}
            disabled={!selectedSubject}
            className={`
              inline-flex items-center gap-3 px-10 py-4 rounded-2xl 
              font-bold text-lg shadow-xl transition-all
              ${
                selectedSubject
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-purple-300/50 hover:shadow-2xl hover:shadow-purple-300/60'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }
            `}
            whileHover={selectedSubject ? { scale: 1.05, y: -2 } : {}}
            whileTap={selectedSubject ? { scale: 0.98 } : {}}
          >
            <span>다음 단계로</span>
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </motion.div>

        {/* Helper Text */}
        {!selectedSubject && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-6 text-sm text-[#9CA3AF] font-medium"
          >
            과목을 선택하면 다음 단계로 넘어갈 수 있습니다
          </motion.p>
        )}
      </div>
    </div>
  );
}
