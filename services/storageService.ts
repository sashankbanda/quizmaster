import { Quiz } from '../types';

const QUIZZES_KEY = 'quizmaster_quizzes';

export const saveQuizzes = (quizzes: Quiz[]) => {
  try {
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
  } catch (error) {
    console.error("Failed to save quizzes to localStorage", error);
  }
};

export const getQuizzes = (): Quiz[] => {
  try {
    const data = localStorage.getItem(QUIZZES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to parse quizzes from localStorage", error);
    return [];
  }
};

// We no longer persist results to localStorage as per requirement.
// Results will be handled in-memory within App.tsx state.
