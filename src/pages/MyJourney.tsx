import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Plus, Trophy, Star, ArrowUpCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

type MilestoneType = 'achievement' | 'lesson' | 'life-event';

interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: MilestoneType;
  userId: string;
}

const typeConfig = {
  'achievement': { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'lesson': { icon: ArrowUpCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  'life-event': { icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/10' }
};

export default function MyJourney() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<MilestoneType>('achievement');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'milestones'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Milestone))
        .filter(m => m.userId === user.uid);
      setMilestones(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!title.trim() || !date || !user) return;
    try {
      await addDoc(collection(db, 'milestones'), {
        userId: user.uid,
        title,
        description,
        date: new Date(date).toISOString(),
        type
      });
      setTitle('');
      setDescription('');
      setDate('');
      setIsAdding(false);
      toast.success('Milestone saved');
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast.error('Failed to save milestone');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'milestones', id));
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Journey</h1>
          <p className="text-muted-foreground">Look how far you've come.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="glass">
          <Plus className="w-4 h-4 mr-2" /> Record Milestone
        </Button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="glass p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input 
                  placeholder="Milestone Title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-black/50 border-white/10 md:flex-1 text-lg"
                />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                {(Object.keys(typeConfig) as MilestoneType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all capitalize ${
                      type === t ? typeConfig[t].bg + ' ' + typeConfig[t].color + ' ring-1 ring-white/20' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    {t.replace('-', ' ')}
                  </button>
                ))}
              </div>
              <Textarea 
                placeholder="What happened? What did it mean to you?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-black/50 border-white/10 resize-none min-h-[100px]"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save Milestone</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative border-l border-white/10 ml-6 md:ml-8 space-y-12 pb-12 mt-10">
        {milestones.map((m, idx) => {
          const config = typeConfig[m.type] || typeConfig['achievement'];
          const Icon = config.icon;
          
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-8 md:pl-12 group"
            >
              <div className={`absolute -left-6 w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center ${config.bg} shadow-lg z-10 bg-black`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              
              <Card className="glass-card p-6 relative">
                <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(m.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-white pr-8">{m.title}</h3>
                  <span className="text-sm font-mono text-muted-foreground mt-1 md:mt-0">
                    {m.date && !isNaN(new Date(m.date).getTime()) ? format(new Date(m.date), 'MMMM yyyy') : 'No Date'}
                  </span>
                </div>
                {m.description && (
                  <p className="text-white/80 leading-relaxed mt-4 border-l-2 border-white/10 pl-4">
                    {m.description}
                  </p>
                )}
              </Card>
            </motion.div>
          );
        })}
        
        {milestones.length === 0 && !isAdding && (
          <div className="pl-12 text-muted-foreground py-10">
            <p>Your journey timeline is waiting to be written.</p>
          </div>
        )}
      </div>
    </div>
  );
}
