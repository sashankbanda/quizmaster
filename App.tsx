import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, ListChecks, BrainCircuit, Trash2, Play, Edit2, UserCircle, Shield, LogOut, Moon, Sun } from 'lucide-react';

import { Dashboard } from './components/Dashboard';
import { QuizParser } from './components/QuizParser';
import { QuizTaker } from './components/QuizTaker';
import { getQuizzes, saveQuizzes } from './services/storageService';
import { Quiz, QuizResult } from './types';

// --- Nav Components ---
const Sidebar = ({ 
  isAdmin, 
  toggleAdmin, 
  isDark, 
  toggleTheme 
}: { 
  isAdmin: boolean, 
  toggleAdmin: () => void,
  isDark: boolean,
  toggleTheme: () => void
}) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Available Quizzes', icon: ListChecks },
    { path: '/stats', label: 'Session Stats', icon: LayoutDashboard },
  ];

  if (isAdmin) {
    navItems.push({ path: '/create', label: 'Create Quiz', icon: Plus });
  }

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 hidden md:flex z-10 transition-colors duration-200">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold text-slate-900 dark:text-white">QuizMaster</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button 
          onClick={toggleAdmin}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isAdmin 
              ? 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {isAdmin ? <Shield className="w-5 h-5" /> : <UserCircle className="w-5 h-5" />}
          {isAdmin ? 'Admin Mode' : 'Student Mode'}
        </button>
      </div>
    </div>
  );
};

const MobileNav = ({ isAdmin }: { isAdmin: boolean }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 flex justify-around p-3 shadow-lg transition-colors duration-200">
      <Link to="/" className="p-2 text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1">
        <ListChecks className="w-6 h-6" />
        <span className="text-[10px]">Quizzes</span>
      </Link>
      <Link to="/stats" className="p-2 text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1">
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-[10px]">Stats</span>
      </Link>
      {isAdmin && (
        <Link to="/create" className="p-2 text-blue-600 dark:text-blue-400 flex flex-col items-center gap-1">
          <Plus className="w-6 h-6" />
          <span className="text-[10px]">Create</span>
        </Link>
      )}
    </div>
  );
};

// --- Main Content Components ---

const AppContent = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  // Results are now session-only, stored in state, lost on reload
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
      if (isDark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  useEffect(() => {
    // Load persisted quizzes
    const loaded = getQuizzes();
    setQuizzes(loaded);
  }, []);

  const handleSaveQuiz = (newQuiz: Quiz) => {
    // If ID exists, update. Else add new.
    const existingIdx = quizzes.findIndex(q => q.id === newQuiz.id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...quizzes];
      updated[existingIdx] = newQuiz;
    } else {
      updated = [newQuiz, ...quizzes];
    }
    
    setQuizzes(updated);
    saveQuizzes(updated);
    navigate('/');
  };

  const handleDeleteQuiz = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation if inside a link
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      const updated = quizzes.filter(q => q.id !== id);
      setQuizzes(updated);
      saveQuizzes(updated);
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    // Save session result
    setResults(prev => [...prev, result]);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar 
        isAdmin={isAdmin} 
        toggleAdmin={() => setIsAdmin(!isAdmin)} 
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm md:hidden transition-colors duration-200">
            <div className="flex items-center gap-2">
               <BrainCircuit className="w-6 h-6 text-blue-600 dark:text-blue-500" />
               <span className="font-bold text-slate-900 dark:text-white">QuizMaster</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-400">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsAdmin(!isAdmin)} className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 rounded-full">
                  {isAdmin ? 'ADMIN' : 'USER'}
              </button>
            </div>
        </header>
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Routes>
            <Route path="/stats" element={
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Session Stats</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Performance analytics for your current session.</p>
                <Dashboard results={results} isDark={isDark} />
              </div>
            } />
            
            <Route path="/create" element={
              isAdmin ? (
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Quiz</h1>
                  <QuizParser onSave={handleSaveQuiz} onCancel={() => navigate('/')} />
                </div>
              ) : (
                <div className="text-center py-20">
                    <Shield className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Admin Access Required</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Switch to Admin mode to create quizzes.</p>
                </div>
              )
            } />

            <Route path="/edit/:id" element={
                isAdmin ? <QuizEditorWrapper quizzes={quizzes} onSave={handleSaveQuiz} /> : <div>Access Denied</div>
            } />
            
            <Route path="/" element={
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Available Quizzes</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select a quiz to start practicing</p>
                  </div>
                  {isAdmin && (
                    <Link to="/create" className="hidden md:inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
                        <Plus className="w-4 h-4" /> New Quiz
                    </Link>
                  )}
                </div>
                
                {quizzes.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                    <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ListChecks className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No quizzes available</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{isAdmin ? "Create your first quiz to get started" : "Ask an admin to add some quizzes!"}</p>
                    {isAdmin && (
                        <Link to="/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            Create Quiz
                        </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(quiz => (
                      <div key={quiz.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col group">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{quiz.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                            {quiz.description || `${quiz.questions.length} questions to test your knowledge.`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                             <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{quiz.questions.length} Qs</span>
                             <span>•</span>
                             <span>Added {new Date(quiz.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                          <Link 
                            to={`/take/${quiz.id}`} 
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <Play className="w-4 h-4" /> Start
                          </Link>
                          {isAdmin && (
                            <>
                                <Link 
                                    to={`/edit/${quiz.id}`}
                                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Edit Quiz"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Link>
                                <button 
                                    onClick={(e) => handleDeleteQuiz(e, quiz.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Delete Quiz"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            } />

            <Route path="/take/:id" element={<QuizTakerWrapper quizzes={quizzes} onComplete={handleQuizComplete} isDark={isDark} />} />
          </Routes>
        </div>
      </main>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
};

// --- Wrapper Components ---

const QuizTakerWrapper = ({ quizzes, onComplete, isDark }: { quizzes: Quiz[], onComplete: (r: QuizResult) => void, isDark: boolean }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const id = location.pathname.split('/').pop();
    const quiz = quizzes.find(q => q.id === id);

    if (!quiz) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <p>Quiz not found</p>
            <button onClick={() => navigate('/')} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline">Return Home</button>
        </div>
    );

    return <QuizTaker quiz={quiz} onComplete={onComplete} onExit={() => navigate('/')} isDark={isDark} />;
}

const QuizEditorWrapper = ({ quizzes, onSave }: { quizzes: Quiz[], onSave: (q: Quiz) => void }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const id = location.pathname.split('/').pop();
    const quiz = quizzes.find(q => q.id === id);

    if (!quiz) return <div className="dark:text-white">Quiz not found</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Edit Quiz</h1>
            <QuizParser initialQuiz={quiz} onSave={onSave} onCancel={() => navigate('/')} />
        </div>
    );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}