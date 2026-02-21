import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Home } from './components/Home';
import { SubjectSelect } from './components/SubjectSelect';
import { ScriptForm } from './components/ScriptForm';
import { ScriptResult } from './components/ScriptResult';
import { AuthModal } from './components/AuthModal';
import { projectId } from '/utils/supabase/info';

export type Subject = '국어' | '사회' | '도덕' | '역사' | '영어';

export type Step = 'home' | 'subject' | 'form' | 'result';

export interface User {
  email: string;
  name: string;
  accessToken?: string;
}

export interface CustomCharacter {
  id: string;
  number: number;
  name: string;
}

export interface ScriptFormData {
  subject: Subject;
  topic: string;
  topicGeneratedByAI: boolean;
  gradeLevel: string;
  groupSize: number;
  timeMinutes: number;
  characterCount: number;
  customCharacters: CustomCharacter[];
  includeDiscussionLeader: boolean;
  includeStudentTeacherLayout: boolean;
  includeAchievementStandards: boolean;
}

export interface GeneratedScript {
  formData: ScriptFormData;
  title: string;
  situationAndRole: string;
  keyTerms: Array<{ term: string; definition: string }>;
  characters: Array<{ name: string; description: string }>;
  dialogue: Array<{ character: string; line: string; color?: string }>;
  teachingPoints: string[];
  teacherTips: string[];
  achievementStandards: { subject: string; standard: string };
  closingQuestions: string[];
}

export default function App() {
  const [step, setStep] = useState<Step>('home');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogin = async (email: string, password: string, name?: string) => {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9b937296`;

    try {
      // 회원가입 모드인 경우 먼저 계정 생성
      if (name) {
        const signupRes = await fetch(`${baseUrl}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        if (!signupRes.ok) {
          const err = await signupRes.json();
          // 이미 존재하는 계정이면 로그인으로 계속 진행
          if (!err.error?.includes('already')) {
            throw new Error(err.error || '회원가입 실패');
          }
        }
      }

      // 로그인
      const loginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error || '로그인 실패');
      }

      const displayName = loginData.user.name || name || email.split('@')[0];
      setUser({
        email: loginData.user.email,
        name: displayName,
        accessToken: loginData.accessToken,
      });
      setShowAuthModal(false);
      toast.success(`환영합니다, ${displayName}님!`);
      // 로그인 성공 시 과목 선택 화면으로 자동 이동
      setStep('subject');
    } catch (err: any) {
      throw new Error(err.message || '로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSubjectSelect = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setStep('subject');
  };

  const handleSubjectChosen = (subject: Subject) => {
    setSelectedSubject(subject);
    setStep('form');
  };

  const handleScriptGenerated = (script: GeneratedScript) => {
    setGeneratedScript(script);
    setStep('result');
  };

  const handleNewScript = () => {
    setGeneratedScript(null);
    setSelectedSubject(null);
    setStep('home');
  };

  return (
    <>
      <Toaster position="top-center" richColors />

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}

      {step === 'home' && (
        <Home
          onSubjectSelect={handleSubjectSelect}
          user={user}
          onLogin={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />
      )}

      {step === 'subject' && (
        <SubjectSelect
          onBack={() => setStep('home')}
          onNext={handleSubjectChosen}
        />
      )}

      {step === 'form' && selectedSubject && (
        <ScriptForm
          subject={selectedSubject}
          onBack={() => setStep('subject')}
          onSubmit={handleScriptGenerated}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {step === 'result' && generatedScript && (
        <ScriptResult
          script={generatedScript}
          onBack={() => setStep('form')}
          onNewScript={handleNewScript}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
