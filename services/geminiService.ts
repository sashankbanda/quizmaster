import { GoogleGenAI, Type } from "@google/genai";
import { Quiz } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const generateQuizFromTopic = async (topic: string): Promise<Quiz> => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Create a multiple-choice quiz about "${topic}". 
    Include a title, a short description, and 5 questions.
    For each question, provide 4 options and the correct answer text.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.STRING }
              },
              required: ["text", "options", "correctAnswer"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate quiz content");
  }

  const data = JSON.parse(response.text);
  
  return {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description || "",
    questions: data.questions.map((q: any) => ({
      id: crypto.randomUUID(),
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer
    })),
    createdAt: Date.now()
  };
};