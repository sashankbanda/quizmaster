import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { QuizResult } from '../types';
import { Trophy, Target, BookOpen, Activity } from 'lucide-react';

interface DashboardProps {
  results: QuizResult[];
  isDark?: boolean;
}

const COLORS = ['#22c55e', '#ef4444'];

export const Dashboard: React.FC<DashboardProps> = ({ results, isDark = false }) => {
  const stats = useMemo(() => {
    const totalTaken = results.length;
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const totalQuestions = results.reduce((acc, r) => acc + r.totalQuestions, 0);
    
    const overallAccuracy = totalQuestions > 0 
      ? Math.round((totalScore / totalQuestions) * 100) 
      : 0;
      
    const perfect = results.filter(r => r.score === r.totalQuestions).length;
    
    // Chart Data
    const chartData = results.map((r, i) => ({
      name: r.quizTitle.substring(0, 15) + (r.quizTitle.length > 15 ? '...' : ''),
      score: Math.round((r.score / r.totalQuestions) * 100),
      fullTitle: r.quizTitle
    }));

    return { totalTaken, overallAccuracy, perfect, chartData };
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No session activity yet</h3>
        <p className="text-slate-500 dark:text-slate-400">Complete a quiz to see your real-time analytics here.</p>
      </div>
    );
  }

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Quizzes (This Session)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTaken}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Overall Accuracy</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overallAccuracy}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Perfect Scores</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.perfect}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Session Performance</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: textColor}} stroke={gridColor} />
              <YAxis domain={[0, 100]} unit="%" tick={{fill: textColor}} stroke={gridColor} />
              <Tooltip 
                cursor={{fill: isDark ? '#1e293b' : '#f1f5f9'}}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  color: isDark ? '#fff' : '#000'
                }}
              />
              <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};