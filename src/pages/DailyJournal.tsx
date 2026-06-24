import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Plus, Sparkles, Frown, Smile, Zap, Book, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

type Mood = 'happy' | 'low' | 'exciting' | 'thought' | 'lesson';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: Mood;
  userId: string;
}

const moods: { type: Mood; icon: React.FC<any>; label: string; color: string }[] = [
  { type: 'happy', icon: Smile, label: 'Happy', color: 'text-green-400 bg-green-400/10' },
  { type: 'low', icon: Frown, label: 'Low', color: 'text-blue-400 bg-blue-400/10' },
  { type: 'exciting', icon: Zap, label: 'Exciting', color: 'text-yellow-400 bg-yellow-400/10' },
  { type: 'thought', icon: Plus, label: 'Random', color: 'text-purple-400 bg-purple-400/10' },
  { type: 'lesson', icon: Book, label: 'Lesson', color: 'text-primary bg-primary/10' },
];

export default function DailyJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood>('thought');
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'journalEntries'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry))
        .filter(entry => entry.userId === user.uid);
      setEntries(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!content.trim() || !user) return;

    try {
      await addDoc(collection(db, 'journalEntries'), {
        userId: user.uid,
        content,
        mood: selectedMood,
        date: new Date().toISOString()
      });
      setContent('');
      setIsComposing(false);
      toast.success('Entry saved. Proud of you.');
    } catch (error) {
      toast.error('Failed to save entry');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'journalEntries', id));
      toast.success('Entry deleted');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Daily Journal</h1>
          <p className="text-muted-foreground">Document your thoughts, track your growth.</p>
        </div>
        {!isComposing && (
          <Button 
            onClick={() => setIsComposing(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" /> Write
          </Button>
        )}
      </header>

      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <Card className="glass p-6 space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {moods.map((m) => (
                  <button
                    key={m.type}
                    onClick={() => setSelectedMood(m.type)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap ${
                      selectedMood === m.type 
                        ? m.color + ' ring-1 ring-white/20' 
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind today?"
                className="min-h-[150px] bg-black/50 border-white/10 text-lg resize-none focus-visible:ring-primary/50"
              />
              <div className="flex justify-end space-x-3">
                <Button variant="ghost" onClick={() => setIsComposing(false)}>Cancel</Button>
                <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save Entry</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {entries.map((entry, index) => {
          const moodDef = moods.find(m => m.type === entry.mood) || moods[0];
          const MoodIcon = moodDef.icon;
          
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 glass bg-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10">
                <MoodIcon className={`w-5 h-5 ${moodDef.color.split(' ')[0]}`} />
              </div>
              <Card className="glass-card w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 hover:bg-white/5 transition-colors duration-300 group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded-md ${moodDef.color}`}>
                      {moodDef.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.date && !isNaN(new Date(entry.date).getTime()) ? format(new Date(entry.date), 'MMM d, yyyy • h:mm a') : 'Unknown Date'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </p>
              </Card>
            </motion.div>
          );
        })}
        {entries.length === 0 && !isComposing && !isLoading && (
          <div className="text-center py-20 text-muted-foreground glass rounded-3xl relative z-10 mx-10">
            <Sparkles className="w-8 h-8 mx-auto mb-4 opacity-50" />
            <p>Your journal is empty.</p>
            <p className="text-sm">Start writing to see your journey unfold.</p>
          </div>
        )}
      </div>
    </div>
  );
}
