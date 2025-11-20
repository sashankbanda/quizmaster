export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string; // The text of the correct answer
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  createdAt: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  date: number;
}

export interface AnalyticsData {
  totalQuizzesTaken: number;
  averageScore: number;
  perfectScores: number;
  history: { date: string; score: number }[];
}