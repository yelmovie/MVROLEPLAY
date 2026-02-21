import { useState } from 'react';
import { Toaster } from 'sonner';
import { Home } from './components/Home';
import { SubjectSelect } from './components/SubjectSelect';
import { ScriptForm } from './components/ScriptForm';
import { ScriptResult } from './components/ScriptResult';
import { AuthModal } from './components/AuthModal';

export type Subject = '국어' | '사회' | '도덕' | '역사' | '영어';

export type Step = 'home' | 'subject' | 'form' | 'result';

export interface User {
  email: string;
  name: string;
  accessToken?: string;
}

export interface ScriptFormData {
  subject: Subject;
  topic: string;
  gradeLevel: string;
  groupSize: number;
  timeMinutes: number;
  characterCount: number;
  additionalNotes?: string;
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

  const handleLogin = async (email: string, _password: string, name?: string) => {
    setUser({
      email,
      name: name || email.split('@')[0],
    });
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSubjectSelect = () => {
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
