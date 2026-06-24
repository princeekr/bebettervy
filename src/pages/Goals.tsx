import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Target, Plus, CheckCircle2, Archive, Trash2, Edit2, Pin, PinOff } from 'lucide-react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  isPinned: boolean;
  createdAt: string;
}

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const processedRef = useRef<Set<string>>(new Set());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'goals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Goal))
        .filter(g => g.userId === user.uid);
      
      const now = startOfDay(new Date());
      const validGoals: Goal[] = [];

      data.forEach(async (goal) => {
        if (!goal.endDate) {
          validGoals.push(goal);
          return;
        }
        
        const goalEndDate = new Date(goal.endDate);
        if (isNaN(goalEndDate.getTime())) {
          validGoals.push(goal);
          return;
        }
        
        const goalEndStartOfDay = startOfDay(goalEndDate);
        if (differenceInDays(goalEndStartOfDay, now) < 0) {
          if (!processedRef.current.has(goal.id)) {
            processedRef.current.add(goal.id);
            try {
              await addDoc(collection(db, 'milestones'), {
                userId: user.uid,
                title: `Goal Ended: ${goal.title}`,
                description: goal.description || `This goal reached its end date on ${format(goalEndStartOfDay, 'MMM d, yyyy')}.`,
                date: new Date().toISOString(),
                type: 'achievement'
              });
              await deleteDoc(doc(db, 'goals', goal.id));
              toast.success(`Goal "${goal.title}" has ended and moved to My Journey.`);
            } catch (error) {
              console.error('Error auto-moving goal:', error);
              processedRef.current.delete(goal.id);
            }
          }
        } else {
          validGoals.push(goal);
        }
      });

      setGoals(validGoals);
    });
    return () => unsubscribe();
  }, [user]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const archivedGoals = goals.filter(g => g.status === 'archived');
  const pinnedCount = goals.filter(g => g.isPinned && g.status !== 'archived').length;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setIsAdding(false);
    setEditingGoal(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !startDate || !endDate || !user) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      toast.error('End date must be later than start date.');
      return;
    }

    try {
      if (editingGoal) {
        await updateDoc(doc(db, 'goals', editingGoal.id), {
          title,
          description,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });
        toast.success('Goal updated successfully');
      } else {
        if (activeGoals.length >= 3) {
          toast.error('You already have 3 active goals. Complete or remove one to add another.');
          return;
        }
        await addDoc(collection(db, 'goals'), {
          userId: user.uid,
          title,
          description,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          status: 'active',
          isPinned: pinnedCount < 2, // Auto pin if there is room
          createdAt: new Date().toISOString()
        });
        toast.success('Goal created successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal');
    }
  };

  const updateStatus = async (id: string, status: Goal['status']) => {
    try {
      await updateDoc(doc(db, 'goals', id), { status, isPinned: status === 'archived' ? false : undefined });
      toast.success(`Goal marked as ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const togglePin = async (goal: Goal) => {
    if (!goal.isPinned && pinnedCount >= 2) {
      toast.error('You can only pin up to 2 goals to the dashboard.');
      return;
    }
    try {
      await updateDoc(doc(db, 'goals', goal.id), { isPinned: !goal.isPinned });
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
      toast.success('Goal deleted');
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const editGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setStartDate(goal.startDate.split('T')[0]);
    setEndDate(goal.endDate.split('T')[0]);
    setIsAdding(true);
  };

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

  const renderGoalCard = (goal: Goal) => {
    const progress = calculateProgress(goal.startDate, goal.endDate);
    
    return (
      <div key={goal.id} className="relative overflow-hidden rounded-xl bg-destructive/10 group">
        <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 space-x-2">
           {/* Actions behind the card */}
          {goal.status !== 'archived' && (
            <Button variant="ghost" size="icon" onClick={() => togglePin(goal)} className={goal.isPinned ? 'text-primary' : 'text-white'}>
              {goal.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </Button>
          )}
          {goal.status === 'active' && (
            <Button variant="ghost" size="icon" onClick={() => editGoal(goal)} className="text-white">
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {goal.status === 'active' && (
            <Button variant="ghost" size="icon" onClick={() => updateStatus(goal.id, 'completed')} className="text-green-500">
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
          {goal.status === 'completed' && (
            <Button variant="ghost" size="icon" onClick={() => updateStatus(goal.id, 'archived')} className="text-blue-500">
              <Archive className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)} className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: -260, right: 0 }}
          dragElastic={0.1}
          className="relative w-full z-10 bg-black/80" // Background to cover the buttons below
        >
          <Card className="glass-card p-6 border-white/10 hover:border-primary/50 transition-colors">
            {/* Desktop Action buttons - visible on hover (hidden on small touch devices generally by hover media query, but let's keep them here for desktop users) */}
            <div className="hidden md:flex absolute top-4 right-4 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {goal.status !== 'archived' && (
                <Button variant="ghost" size="icon" onClick={() => togglePin(goal)} className={goal.isPinned ? 'text-primary' : 'text-muted-foreground hover:text-white'}>
                  {goal.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                </Button>
              )}
              {goal.status === 'active' && (
                <Button variant="ghost" size="icon" onClick={() => editGoal(goal)} className="text-muted-foreground hover:text-white">
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {goal.status === 'active' && (
                <Button variant="ghost" size="icon" onClick={() => updateStatus(goal.id, 'completed')} className="text-muted-foreground hover:text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              )}
              {goal.status === 'completed' && (
                <Button variant="ghost" size="icon" onClick={() => updateStatus(goal.id, 'archived')} className="text-muted-foreground hover:text-blue-500">
                  <Archive className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-4 pr-0 md:pr-32">
              <h3 className="text-xl font-semibold text-white mb-1">{goal.title}</h3>
              {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs font-mono text-muted-foreground mb-2">
                <span>{goal.startDate ? (isNaN(new Date(goal.startDate).getTime()) ? 'Invalid' : format(new Date(goal.startDate), 'MMM d, yyyy')) : 'No date'}</span>
                <span>{goal.endDate ? (isNaN(new Date(goal.endDate).getTime()) ? 'Invalid' : format(new Date(goal.endDate), 'MMM d, yyyy')) : 'No date'}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${goal.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="font-mono text-primary font-medium">{progress}% Complete</span>
              <span className="text-muted-foreground px-3 py-1 bg-white/5 rounded-full text-xs">
                {goal.status === 'completed' ? 'Completed' : getDaysRemainingText(goal.endDate)}
              </span>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-10 text-center">
        <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-primary/50">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-gradient mb-4">Goals</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Focus on what truly matters.
        </p>
      </header>

      <AnimatePresence>
        {!isAdding && activeGoals.length < 3 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <Button 
              onClick={() => setIsAdding(true)}
              className="w-full glass-card hover:bg-white/5 border-dashed py-8 text-muted-foreground hover:text-white transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Goal
            </Button>
          </motion.div>
        )}
        
        {!isAdding && activeGoals.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center text-sm text-muted-foreground bg-primary/10 border border-primary/20 rounded-xl p-4"
          >
            You already have 3 active goals. Complete or remove one to add another.
          </motion.div>
        )}

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12 overflow-hidden"
          >
            <Card className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="Goal Title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-black/50 border-white/10"
                />
                <Textarea 
                  placeholder="Short Description (Optional)" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-black/50 border-white/10 resize-none"
                  rows={2}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground ml-1">Start Date</label>
                    <Input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-black/50 border-white/10 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground ml-1">End Date</label>
                    <Input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-black/50 border-white/10 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!title.trim() || !startDate || !endDate}>
                    Save Goal
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-12">
        {activeGoals.length > 0 && (
          <section>
            <h2 className="text-xl font-medium text-white mb-6 flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary mr-3 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              Active Goals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeGoals.map(renderGoalCard)}
            </div>
          </section>
        )}

        {completedGoals.length > 0 && (
          <section>
            <h2 className="text-xl font-medium text-white mb-6 flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-3 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              Completed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
              {completedGoals.map(renderGoalCard)}
            </div>
          </section>
        )}

        {archivedGoals.length > 0 && (
          <section>
            <h2 className="text-xl font-medium text-white mb-6 flex items-center text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted-foreground mr-3" />
              Archived
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
              {archivedGoals.map(renderGoalCard)}
            </div>
          </section>
        )}

        {goals.length === 0 && !isAdding && (
          <div className="text-center py-20 text-muted-foreground glass rounded-3xl">
            <Target className="w-8 h-8 mx-auto mb-4 opacity-50" />
            <p>You don't have any goals yet.</p>
            <p className="text-sm mt-2">Start small. What do you want to achieve?</p>
          </div>
        )}
      </div>
    </div>
  );
}
