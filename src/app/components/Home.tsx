import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Menu, X, LogOut, User as UserIcon, Sparkles, Zap, Download, BookOpen, Users, Heart, Globe, MessageCircle } from 'lucide-react';
import { Subject, User } from '../App';
import { Logo } from './Logo';
import heroImage from '../../assets/e8f5fb7307f34550ab739cf8cfd7a4fdf4302e43.png';
import feature1Bg from '../../assets/65bbb30be4c95ba8d93e0a08d5a3e68c354cccbc.png';
import feature2Bg from '../../assets/3017ea46519b7285d91dde65c30587639448a921.png';
import feature3Bg from '../../assets/a9eeade88c0c2e1fc99c60ecc87c4023591f4647.png';
import koreanSubjectBg from '../../assets/d077332a32679a4891614d8b307ade48e832f521.png';
import socialSubjectBg from '../../assets/2fa385bf8be504e7ee2ad7c9b7be6dc6a36516ff.png';
import moralSubjectBg from '../../assets/22c679c7814cc02fa23fbed5ed9572138d121d7b.png';
import historySubjectBg from '../../assets/ba64b59fe2f1620c19affe4af43549a6f8ab1b52.png';
import englishSubjectBg from '../../assets/640cf98b0cee4dd32a4fb9eb08862465f1b5b925.png';

interface HomeProps {
  onSubjectSelect: () => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

const subjects = [
  {
    id: '국어' as Subject,
    title: '국어',
    description: '말하기·듣기·읽기·쓰기를 역할극으로',
    icon: <BookOpen className="w-12 h-12" />,
    gradient: 'from-pink-400 via-rose-400 to-pink-500',
    bgColor: 'bg-pink-50/50',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-50',
  },
  {
    id: '사회' as Subject,
    title: '사회',
    description: '우리 사회의 규칙과 공동체를 탐구',
    icon: <Globe className="w-12 h-12" />,
    gradient: 'from-blue-400 via-cyan-400 to-blue-500',
    bgColor: 'bg-blue-50/50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-50',
  },
  {
    id: '도덕' as Subject,
    title: '도덕',
    description: '가치·공감·배려를 대화로 연습',
    icon: <Heart className="w-12 h-12" />,
    gradient: 'from-purple-400 via-pink-400 to-purple-500',
    bgColor: 'bg-purple-50/50',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-50',
  },
  {
    id: '역사' as Subject,
    title: '역사',
    description: '인물·사건을 생생하게 이해',
    icon: <Users className="w-12 h-12" />,
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    bgColor: 'bg-amber-50/50',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-50',
  },
  {
    id: '영어' as Subject,
    title: '영어',
    description: '실생활 의사소통을 역할극으로',
    icon: <MessageCircle className="w-12 h-12" />,
    gradient: 'from-indigo-400 via-purple-400 to-indigo-500',
    bgColor: 'bg-indigo-50/50',
    borderColor: 'border-indigo-200',
    hoverBg: 'hover:bg-indigo-50',
  },
];

const features = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: '빠른 생성',
    description: '30초 안에 완성되는 맞춤형 대본',
    gradient: 'from-yellow-400 to-orange-400',
    bgColor: 'bg-yellow-50',
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: 'AI 기반',
    description: '교육 맥락을 고려한 스마트 생성',
    gradient: 'from-purple-400 to-pink-400',
    bgColor: 'bg-purple-50',
  },
  {
    icon: <Download className="w-8 h-8" />,
    title: '즉시 활용',
    description: 'DOCX 다운로드로 바로 수업 투입',
    gradient: 'from-green-400 to-emerald-400',
    bgColor: 'bg-green-50',
  },
];

export function Home({ onSubjectSelect, user, onLogin, onLogout }: HomeProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FEF9F3] relative overflow-hidden">
      {/* Gradient Background Overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-emerald-100/30"></div>
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-200/20 to-pink-200/20 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-200/20 to-cyan-200/20 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-20 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Logo className="w-10 h-10 sm:w-12 sm:h-12" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#1F2937] tracking-tight">
                  Roleplay Snap
                </h1>
                <p className="text-xs text-[#6B7280] hidden sm:block font-medium">AI 역할극 대본 생성기</p>
              </div>
            </motion.div>
            
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border-2 border-purple-200">
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                    <UserIcon className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-sm font-semibold text-[#1F2937]">{user.name}</span>
                  </div>
                  <motion.button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 border-2 border-red-200 transition-all text-red-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-semibold">로그아웃</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={onLogin}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-semibold shadow-lg shadow-purple-300/50 transition-all"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.35)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  로그인
                </motion.button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#1F2937]" />
              ) : (
                <Menu className="w-6 h-6 text-[#1F2937]" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-gray-200"
            >
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border-2 border-purple-200">
                    <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                    <UserIcon className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-sm font-semibold text-[#1F2937]">{user.name}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border-2 border-red-200 transition-colors text-red-600 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">로그아웃</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-semibold shadow-lg"
                >
                  로그인
                </button>
              )}
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 mb-6 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-sm font-bold text-[#1F2937]">초등 교사를 위한 AI 도구</span>
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-[#1F2937] leading-tight tracking-tight">
                역할극 대본을
                <br />
                <span className="bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-[#10B981] bg-clip-text text-transparent">
                  30초 만에 생성
                </span>
              </h2>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg sm:text-xl text-[#6B7280] mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              학년, 인원, 시간을 설정하면 AI가 자동으로<br className="hidden sm:block" />
              교육 과정에 맞는 역할극 대본을 만들어드려요
            </motion.p>

            {/* CTA Button */}
            <motion.button
              onClick={onSubjectSelect}
              className="inline-flex items-center gap-3 px-12 py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-bold text-lg shadow-xl shadow-purple-300/50 transition-all group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.05, y: -2, boxShadow: "0 25px 30px -5px rgba(124, 58, 237, 0.4)" }}
              whileTap={{ scale: 0.98 }}
            >
              <span>대본 만들기 시작</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {/* Hero Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-16"
          >
            <motion.div
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-[90%] sm:w-[600px] md:w-[700px] lg:w-[800px] h-64 sm:h-80 md:h-96 rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <img 
                src={heroImage} 
                alt="교실에서 역할극을 하는 아이들" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="grid grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto"
          >
            {[
              { label: '지원 과목', value: '5개', color: 'from-purple-400 to-pink-400' },
              { label: '생성 시간', value: '30초', color: 'from-emerald-400 to-cyan-400' },
              { label: '맞춤 설정', value: '자유', color: 'from-amber-400 to-orange-400' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="text-center p-5 sm:p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-[#6B7280] font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl sm:text-4xl font-bold text-[#1F2937] mb-4 tracking-tight">
              왜 Roleplay Snap인가요?
            </h3>
            <p className="text-lg text-[#6B7280] font-medium">
              교사의 시간을 아끼고, 수업의 질을 높입니다
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`text-center p-8 rounded-3xl border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all relative overflow-hidden bg-white`}
              >
                {/* 모든 카드에 배경 이미지 추가 */}
                {index === 0 && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <img 
                      src={feature1Bg} 
                      alt="" 
                      className="w-full h-full object-cover scale-110 object-[center_60%]"
                    />
                  </div>
                )}
                {index === 1 && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <img 
                      src={feature2Bg} 
                      alt="" 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                )}
                {index === 2 && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <img 
                      src={feature3Bg} 
                      alt="" 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                )}
                
                <h4 
                  className="text-4xl font-bold mb-3 relative z-10 mt-6"
                  style={{
                    color: '#1F2937',
                    textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 3px 3px 6px rgba(255,255,255,0.8)'
                  }}
                >
                  {feature.title}
                </h4>
                <p 
                  className="leading-relaxed font-medium relative z-10"
                  style={{
                    color: '#1F2937',
                    textShadow: '1.5px 1.5px 0 #fff, -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 2px 2px 4px rgba(255,255,255,0.8)'
                  }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Preview Section */}
      <section id="subjects-section" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1F2937] mb-4 tracking-tight">
              5개 과목 지원
            </h3>
            <p className="text-lg text-[#6B7280] font-medium">
              국어, 사회, 도덕, 역사, 영어 수업에 모두 활용 가능합니다
            </p>
          </motion.div>

          {/* Subject Cards - Preview Only */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 max-w-5xl mx-auto mb-12">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 rounded-3xl border-2 border-gray-200 shadow-sm relative overflow-hidden bg-white"
              >
                {/* 모든 과목 카드에 배경 이미지 추가 */}
                {index === 0 && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <img 
                      src={koreanSubjectBg} 
                      alt="" 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                )}
                {index === 1 && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <img 
                      src={socialSubjectBg} 
                      alt="" 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                )}
                {index === 2 && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <img 
                      src={moralSubjectBg} 
                      alt="" 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                )}
                {index === 3 && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <img 
                      src={historySubjectBg} 
                      alt="" 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                )}
                {index === 4 && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <img 
                      src={englishSubjectBg} 
                      alt="" 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                )}
                
                <h4 
                  className="font-bold relative z-10 text-4xl mt-6"
                  style={{
                    color: '#1F2937',
                    textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 3px 3px 6px rgba(255,255,255,0.8)'
                  }}
                >
                  {subject.title}
                </h4>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-gray-200 bg-white/80 backdrop-blur-sm py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo className="w-10 h-10" />
            <span className="font-bold text-[#1F2937] text-xl">Roleplay Snap</span>
          </div>
          <p className="text-sm text-[#6B7280] mb-2 font-medium">
            초등학교 교사를 위한 AI 역할극 대본 생성기
          </p>
          <p className="text-xs text-[#9CA3AF]">
            © 2026 Roleplay Snap. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
