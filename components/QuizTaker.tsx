import React, { useState, useEffect } from 'react';
import { Quiz, QuizResult, Question } from '../types';
import { CheckCircle, XCircle, Home, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface QuizTakerProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
  isDark?: boolean;
}

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Helper to remove "a) ", "1. ", "A. " prefixes for clean display and comparison
const stripLabel = (str: string) => {
  return str.replace(/^([a-zA-Z]|[0-9]+)[\)\.]\s+/, '').trim();
};

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, onComplete, onExit, isDark = false }) => {
  // State for the randomized version of the quiz
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  // State for user answers: { [questionId]: selectedOptionString }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize logic: Shuffle questions and options on mount
  useEffect(() => {
    // Randomize questions
    const randomized = shuffleArray(quiz.questions).map(q => {
      // 1. Shuffle the options first
      const shuffledRawOptions = shuffleArray([...q.options]);
      
      // 2. Strip labels from the options (e.g. "a) Apple" -> "Apple")
      const cleanedOptions = shuffledRawOptions.map(stripLabel);
      
      // 3. Strip label from the correct answer to ensure we compare apples to apples
      const cleanedCorrect = stripLabel(q.correctAnswer);

      return {
        ...q,
        options: cleanedOptions,
        correctAnswer: cleanedCorrect
      };
    });
    
    setShuffledQuestions(randomized);
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    window.scrollTo(0, 0);
  }, [quiz.id]);

  const handleSelect = (questionId: string, option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = () => {
    // Calculate Score
    let calculatedScore = 0;
    shuffledQuestions.forEach(q => {
      const userAns = answers[q.id];
      // Compare stripped strings (case-insensitive for safety, though text should match)
      if (userAns && userAns.toLowerCase() === q.correctAnswer.toLowerCase()) {
        calculatedScore++;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);
    
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });

    onComplete({
      id: crypto.randomUUID(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: calculatedScore,
      totalQuestions: shuffledQuestions.length,
      date: Date.now()
    });
  };

  // --- Result Components ---

  const renderSummary = () => {
    const total = shuffledQuestions.length;
    const percentage = Math.round((score / total) * 100);
    const incorrect = total - score;
    
    const chartData = [
      { name: 'Correct', value: score },
      { name: 'Incorrect', value: incorrect },
    ];
    const COLORS = ['#22c55e', '#ef4444'];

    let message = "Good effort!";
    if (percentage >= 90) message = "Outstanding!";
    else if (percentage >= 70) message = "Great job!";
    else if (percentage < 50) message = "Keep practicing!";

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 animate-fade-in transition-colors duration-200">
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 text-center">
          <h2 className="text-2xl font-bold mb-1">{message}</h2>
          <p className="text-slate-300 text-sm">You scored {score} out of {total}</p>
        </div>
        
        <div className="p-6 flex flex-col md:flex-row gap-8 items-center justify-center">
           <div className="flex-1 w-full max-w-xs space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                 <span className="text-slate-500 dark:text-slate-400 font-medium">Score</span>
                 <span className="text-2xl font-bold text-slate-900 dark:text-white">{percentage}%</span>
              </div>
              <button onClick={onExit} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm">
                <Home className="w-4 h-4" />
                Back to List
             </button>
           </div>

           <div className="h-40 w-40 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={40}
                   outerRadius={60}
                   paddingAngle={5}
                   dataKey="value"
                   stroke={isDark ? '#0f172a' : '#fff'} // Match background
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                    contentStyle={{ 
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        color: isDark ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                 />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{score}/{total}</p>
             </div>
           </div>
        </div>
      </div>
    );
  };

  if (shuffledQuestions.length === 0) {
      return <div className="p-8 text-center dark:text-white">Loading quiz...</div>;
  }

  const progress = Object.keys(answers).length;
  const total = shuffledQuestions.length;
  const isAllAnswered = progress === total;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{quiz.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{isSubmitted ? 'Results & Review' : 'Answer all questions below'}</p>
        </div>
        {!isSubmitted && (
            <div className="text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                {progress} / {total} Answered
            </div>
        )}
      </div>

      {isSubmitted && renderSummary()}

      <div className="space-y-6">
        {shuffledQuestions.map((q, idx) => {
          const userSelection = answers[q.id];
          const correctAns = q.correctAnswer; // This is already stripped
          
          const isUserCorrect = userSelection === correctAns;

          // Determine styling based on submission state
          let cardBorder = "border-slate-200 dark:border-slate-800";
          let statusIcon = null;

          if (isSubmitted) {
            if (isUserCorrect) {
               cardBorder = "border-green-500 ring-1 ring-green-500 dark:border-green-600 dark:ring-green-600";
               statusIcon = <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium text-sm"><CheckCircle2 className="w-4 h-4" /> Correct</div>;
            } else {
               cardBorder = "border-red-300 dark:border-red-700";
               statusIcon = <div className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium text-sm"><XCircle className="w-4 h-4" /> Incorrect</div>;
            }
          }

          return (
            <div key={q.id} className={`bg-white dark:bg-slate-900 rounded-xl border ${cardBorder} shadow-sm p-6 transition-all`}>
              <div className="flex justify-between items-start mb-4 gap-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white leading-snug flex-1">
                    <span className="text-slate-400 dark:text-slate-500 font-normal mr-2">{idx + 1}.</span>
                    {q.text}
                  </h3>
                  {statusIcon}
              </div>

              <div className="space-y-2">
                {q.options.map((option, optIdx) => {
                  const isSelected = userSelection === option;
                  const isThisOptionCorrect = option === correctAns;
                  
                  let btnClass = "w-full text-left p-3 rounded-lg border transition-all relative ";
                  
                  if (isSubmitted) {
                    // Review Mode Styling
                    if (isThisOptionCorrect) {
                        btnClass += "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600 text-green-800 dark:text-green-200 font-medium";
                    } else if (isSelected && !isThisOptionCorrect) {
                        btnClass += "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 line-through decoration-red-400";
                    } else {
                        btnClass += "border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60";
                    }
                  } else {
                    // Active Taking Mode Styling
                    if (isSelected) {
                        btnClass += "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm font-medium";
                    } else {
                        btnClass += "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(q.id, option)}
                      disabled={isSubmitted}
                      className={btnClass}
                    >
                      <span className="pr-8">{option}</span>
                      {isSubmitted && isThisOptionCorrect && (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                      {isSubmitted && isSelected && !isThisOptionCorrect && (
                          <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {isSubmitted && !isUserCorrect && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Correct Answer: <span className="text-green-700 dark:text-green-400">{correctAns}</span>
                  </p>
                </div>
              )}

              {isSubmitted && !userSelection && (
                  <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Not answered
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="mt-8 sticky bottom-6 z-10">
            <button
                onClick={handleSubmit}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 ${
                    isAllAnswered 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 dark:shadow-none' 
                    : 'bg-slate-800 dark:bg-slate-700 text-slate-200 hover:bg-slate-700 dark:hover:bg-slate-600'
                }`}
            >
                {isAllAnswered ? (
                    <>Submit Quiz <CheckCircle2 className="w-5 h-5" /></>
                ) : (
                    `Submit Quiz (${progress}/${total} Answered)`
                )}
            </button>
        </div>
      )}
    </div>
  );
};