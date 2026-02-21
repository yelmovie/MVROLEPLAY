import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Sparkles } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, password: string, name?: string) => Promise<void>;
}

export function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fillTestAccount = () => {
    setEmail('teacher@test.com');
    setPassword('test1234');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (!isLogin && !name) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!email.includes('@')) {
      setError('올바른 이메일을 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email, password, name);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200"
        >
          {/* Decorative Header with Gradient */}
          <div className="bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-[#10B981] p-8 relative overflow-hidden">
            <motion.div
              className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="text-center relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.1, 
                  type: "spring", 
                  stiffness: 200,
                  damping: 15
                }}
                className="inline-flex p-4 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-lg"
              >
                {isLogin ? (
                  <User className="w-12 h-12 text-white" />
                ) : (
                  <Sparkles className="w-12 h-12 text-white" />
                )}
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {isLogin ? '로그인' : '회원가입'}
              </h2>
              <p className="text-white/90 font-medium">
                {isLogin ? 'MovieSsam에 오신 것을 환영합니다!' : '새로운 계정을 만들어보세요'}
              </p>
            </div>
          </div>

          <div className="p-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <Label htmlFor="name" className="text-[#1F2937] mb-2 block font-semibold">이름</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동"
                      className="pl-12 h-12 bg-[#F3F4F6] border-2 border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white rounded-xl transition-all font-medium hover:border-[#D1D5DB]"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-[#1F2937] mb-2 block font-semibold">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="pl-12 h-12 bg-[#F3F4F6] border-2 border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white rounded-xl transition-all font-medium hover:border-[#D1D5DB]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-[#1F2937] mb-2 block font-semibold">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-12 bg-[#F3F4F6] border-2 border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white rounded-xl transition-all font-medium hover:border-[#D1D5DB]"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-semibold"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-300/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ 
                  scale: isLoading ? 1 : 1.02, 
                  boxShadow: isLoading ? undefined : "0 20px 25px -5px rgba(124, 58, 237, 0.4)"
                }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    {isLogin ? '로그인 중...' : '회원가입 중...'}
                  </span>
                ) : (
                  isLogin ? '로그인' : '회원가입'
                )}
              </motion.button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
                disabled={isLoading}
                className="text-[#6B7280] hover:text-[#7C3AED] transition-colors text-sm font-semibold disabled:opacity-50"
              >
                {isLogin ? (
                  <>
                    계정이 없으신가요?{' '}
                    <span className="text-[#7C3AED] font-bold">회원가입하기</span>
                  </>
                ) : (
                  <>
                    이미 계정이 있으신가요?{' '}
                    <span className="text-[#7C3AED] font-bold">로그인하기</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Account Info */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 shadow-sm"
            >
              <p className="text-sm text-blue-900 text-center font-bold mb-3 flex items-center justify-center gap-2">
                <span className="text-lg">🎓</span>
                테스트 계정으로 바로 시작하세요!
              </p>
              <div className="space-y-2 bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-semibold">📧 이메일:</span>
                  <span className="font-mono text-xs bg-blue-50 px-3 py-1.5 rounded font-bold text-blue-900">teacher@test.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-semibold">🔑 비밀번호:</span>
                  <span className="font-mono text-xs bg-blue-50 px-3 py-1.5 rounded font-bold text-blue-900">test1234</span>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={fillTestAccount}
                disabled={isLoading}
                className="w-full mt-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                ⚡ 테스트 계정으로 자동 입력
              </motion.button>
              <p className="text-xs text-blue-600 text-center mt-3 font-medium">
                💡 첫 로그인 시 계정이 자동으로 생성됩니다 (약 2초 소요)
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
