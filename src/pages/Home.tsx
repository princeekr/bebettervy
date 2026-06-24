import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  isPinned: boolean;
}

export default function Home() {
  const { user } = useAuth();
  const [pinnedGoals, setPinnedGoals] = useState<Goal[]>([]);
  const [latestQuote, setLatestQuote] = useState<{content: string, author?: string} | null>(null);

  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  const dateStr = format(new Date(), 'EEEE, MMMM do');
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'VY';

  const fallbackQuotes = [
    "Your potential is endless. Go do what you were created to do.",
    "Small steps every day.",
    "Everything you need is already inside you.",
    "Be a little better than you were yesterday.",
  ];
  const defaultQuote = fallbackQuotes[new Date().getDay() % fallbackQuotes.length];

  useEffect(() => {
    if (!user) return;
    
    // Fetch Pinned Goals
    const qGoals = query(collection(db, 'goals'), orderBy('createdAt', 'desc'));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Goal))
        .filter(g => g.userId === user.uid && g.isPinned && g.status !== 'archived')
        .slice(0, 2); // Max 2 pinned
      setPinnedGoals(data);
    });

    // Fetch Latest Quote
    const qMotivations = query(collection(db, 'motivations'), orderBy('date', 'desc'));
    const unsubMotivations = onSnapshot(qMotivations, (snapshot) => {
      const data = snapshot.docs
        .map(d => d.data())
        .filter(m => m.userId === user.uid && m.category === 'quote');
      if (data.length > 0) {
        setLatestQuote({ content: data[0].content, author: data[0].author });
      } else {
        setLatestQuote(null);
      }
    });

    return () => {
      unsubGoals();
      unsubMotivations();
    };
  }, [user]);

  const calculateProgress = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    if (isNaN(startDate) || isNaN(endDate)) return 0;
    const now = Date.now();

    if (now <= startDate) return 0;
    if (now >= endDate) return 100;
    
    return Math.round(((now - startDate) / (endDate - startDate)) * 100);
  };

  const getDaysRemainingText = (end: string) => {
    if (!end) return 'Unknown';
    const endDate = new Date(end);
    if (isNaN(endDate.getTime())) return 'Unknown';
    const days = differenceInDays(startOfDay(endDate), startOfDay(new Date()));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Ends Today';
    return `${days} Days Remaining`;
  };

  const displayQuote = latestQuote?.content || defaultQuote;
  const displayAuthor = latestQuote?.author;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {greeting}, {firstName}.
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-lg md:text-xl font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {dateStr}
        </motion.p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={pinnedGoals.length === 0 ? "md:col-span-2" : ""}
        >
          <Card className="glass-card border-white/5 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden relative p-8 h-full flex flex-col justify-center min-h-[200px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            <h2 className="text-sm uppercase tracking-widest text-primary mb-4 font-mono font-semibold">Daily Motivation</h2>
            <p className="text-xl md:text-2xl font-serif text-white/90 leading-relaxed italic">
              "{displayQuote}"
            </p>
            {displayAuthor && (
              <p className="text-sm text-muted-foreground mt-4 font-medium">— {displayAuthor}</p>
            )}
          </Card>
        </motion.div>

        {pinnedGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col gap-4"
          >
            {pinnedGoals.map((goal) => {
              const progress = calculateProgress(goal.startDate, goal.endDate);
              return (
                <Link to="/goals" key={goal.id} className="block group">
                  <Card className="glass-card border-white/5 p-5 relative overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white group-hover:text-primary transition-colors">{goal.title}</h3>
                      <Target className="w-4 h-4 text-primary opacity-50" />
                    </div>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-1">{goal.description}</p>
                    )}
                    
                    <div className="space-y-2 mt-auto">
                      <div className="flex justify-between text-xs font-mono text-muted-foreground">
                        <span>{progress}%</span>
                        <span>{goal.status === 'completed' ? 'Completed' : getDaysRemainingText(goal.endDate)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${goal.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </motion.div>
        )}
      </div>
      
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="glass p-8 rounded-3xl mt-8">
            <h3 className="text-xl font-semibold mb-4">Space to Breathe</h3>
            <p className="text-muted-foreground text-sm italic">Take a deep breath and clear your mind. Today is a new day.</p>
        </div>
      </motion.div>
    </div>
  );
}
