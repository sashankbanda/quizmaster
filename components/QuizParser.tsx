import React, { useState, useEffect } from 'react';
import { Quiz, Question } from '../types';
import { FileText, Wand2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { generateQuizFromTopic } from '../services/geminiService';

interface QuizParserProps {
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
  initialQuiz?: Quiz | null;
}

export const QuizParser: React.FC<QuizParserProps> = ({ onSave, onCancel, initialQuiz }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'generate'>('paste');
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reconstruct text if editing
  useEffect(() => {
    if (initialQuiz) {
      let reconstructed = `${initialQuiz.title}\n\n`;
      initialQuiz.questions.forEach((q, i) => {
        reconstructed += `${i + 1}. ${q.text}\n`;
        q.options.forEach(opt => {
          reconstructed += `${opt}\n`;
        });
        reconstructed += `**Answer: ${q.correctAnswer}**\n\n`;
      });
      setText(reconstructed);
      setActiveTab('paste');
    }
  }, [initialQuiz]);

  const parseText = (inputText: string): Quiz | null => {
    try {
      const lines = inputText.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 3) throw new Error("Text is too short to be a quiz.");

      const title = lines[0];
      
      const questions: Question[] = [];
      let currentQuestion: Partial<Question> = { options: [] };
      let isReadingQuestion = false;

      const questionStartRegex = /^\d+\.\s+(.+)/;
      const optionRegex = /^([a-zA-Z])[\)\.]\s+(.+)/;
      const answerRegex = /^\**Answer:\s*(?:[a-zA-Z][\)\.]\s*)?(.+?)\**$/i;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const questionMatch = line.match(questionStartRegex);
        const optionMatch = line.match(optionRegex);
        const answerMatch = line.match(answerRegex);

        if (answerMatch) {
            if (currentQuestion.text && currentQuestion.options && currentQuestion.options.length > 0) {
                let cleanAnswer = answerMatch[1].trim();
                if (cleanAnswer.endsWith('**')) cleanAnswer = cleanAnswer.slice(0, -2);
                
                currentQuestion.correctAnswer = cleanAnswer;
                questions.push({
                    id: crypto.randomUUID(),
                    text: currentQuestion.text,
                    options: [...currentQuestion.options],
                    correctAnswer: currentQuestion.correctAnswer
                } as Question);
                
                currentQuestion = { options: [] };
                isReadingQuestion = false;
            }
        } else if (questionMatch) {
            currentQuestion = { options: [], text: questionMatch[1] };
            isReadingQuestion = true;
        } else if (optionMatch && isReadingQuestion) {
            currentQuestion.options?.push(line); 
        } else if (isReadingQuestion) {
            if (currentQuestion.options?.length === 0 && currentQuestion.text) {
               currentQuestion.text += " " + line;
            }
        }
      }

      if (questions.length === 0) throw new Error("No valid questions found. Check the format.");

      return {
        id: initialQuiz ? initialQuiz.id : crypto.randomUUID(),
        title,
        questions,
        createdAt: Date.now()
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse quiz.");
      return null;
    }
  };

  const handleManualParse = () => {
    setError(null);
    const quiz = parseText(text);
    if (quiz) {
      onSave(quiz);
    }
  };

  const handleAIGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const quiz = await generateQuizFromTopic(topic);
      onSave(quiz);
    } catch (err) {
      setError("Failed to generate quiz. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in transition-colors duration-200">
      <div className="border-b border-slate-200 dark:border-slate-800 flex justify-between items-center pr-4">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {initialQuiz ? 'Edit Text' : 'Paste Text'}
            </span>
          </button>
          {!initialQuiz && (
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'generate'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Generate with AI
              </span>
            </button>
          )}
        </nav>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {activeTab === 'paste' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50">
              <p className="font-semibold mb-1">Format Guide:</p>
              <pre className="whitespace-pre-wrap font-mono text-xs opacity-80">
{`My Quiz Title

1. Question text here?
a) Option one
b) Option two
**Answer: b) Option two**`}
              </pre>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your quiz content here..."
              className="w-full h-96 p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none leading-relaxed transition-colors"
            />
            <div className="flex justify-end gap-3">
              <button onClick={onCancel} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium">
                Cancel
              </button>
              <button 
                onClick={handleManualParse}
                disabled={!text.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {initialQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Quiz Generator</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Enter a topic and we'll generate a multiple choice quiz for you.</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Advanced React Hooks, European History..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
              <button 
                onClick={handleAIGenerate}
                disabled={loading || !topic.trim()}
                className="w-full py-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};