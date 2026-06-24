import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Pin, Lightbulb, Target, BookOpen, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

type VaultCategory = 'quote' | 'goal' | 'lesson';

interface VaultItem {
  id: string;
  category: VaultCategory;
  content: string;
  author?: string;
  isPinned: boolean;
  date: string;
  userId: string;
}

export default function MotivationVault() {
  const { user } = useAuth();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState<VaultCategory>('quote');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'motivations'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as VaultItem))
        .filter(m => m.userId === user.uid);
      setItems(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!content.trim() || !user) return;
    try {
      await addDoc(collection(db, 'motivations'), {
        userId: user.uid,
        category,
        content,
        author: category === 'quote' ? author : null,
        isPinned: false,
        date: new Date().toISOString()
      });
      setContent('');
      setAuthor('');
      setIsAdding(false);
      toast.success('Saved to vault');
    } catch (error) {
      console.error('Error adding to vault:', error);
      toast.error('Failed to save');
    }
  };

  const togglePin = async (item: VaultItem) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'motivations', item.id), {
        isPinned: !item.isPinned
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'motivations', id));
    } catch (error) {
      console.error('Error deleting motivation:', error);
    }
  };

  const pinnedItems = items.filter(i => i.isPinned);
  const unpinnedItems = items.filter(i => !i.isPinned);

  const renderCard = (item: VaultItem) => (
    <Card key={item.id} className="glass-card p-6 relative group overflow-hidden">
      <div className="absolute top-2 right-2 flex space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => togglePin(item)}
          className={`z-10 transition-opacity ${item.isPinned ? 'opacity-100 text-primary' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-white'}`}
        >
          <Pin className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleDelete(item.id)}
          className="z-10 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {item.category === 'quote' && <Lightbulb className="w-5 h-5 text-primary" />}
          {item.category === 'goal' && <Target className="w-5 h-5 text-secondary" />}
          {item.category === 'lesson' && <BookOpen className="w-5 h-5 text-green-400" />}
        </div>
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 block">{item.category}</span>
          <p className="text-lg font-serif text-white/90 italic leading-relaxed">"{item.content}"</p>
          {item.author && <p className="text-sm text-muted-foreground mt-4">— {item.author}</p>}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Motivation Vault</h1>
          <p className="text-muted-foreground">Words that move you. Goals that guide you.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add 
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
            <Card className="glass p-6 max-w-2xl mx-auto space-y-6">
              <Tabs value={category} onValueChange={(v) => setCategory(v as VaultCategory)}>
                <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-white/10">
                  <TabsTrigger value="quote">Quote</TabsTrigger>
                  <TabsTrigger value="goal">Goal</TabsTrigger>
                  <TabsTrigger value="lesson">Lesson</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                <Textarea 
                  placeholder={`Write your ${category}...`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-black/50 border-white/10 resize-none min-h-[100px]"
                />
                {category === 'quote' && (
                  <Input 
                    placeholder="Author (optional)"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="bg-black/50 border-white/10"
                  />
                )}
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save to Vault</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {pinnedItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary flex items-center">
            <Pin className="w-4 h-4 mr-2" /> Pinned
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pinnedItems.map(renderCard)}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">All Saved</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unpinnedItems.map(renderCard)}
        </div>
      </section>
    </div>
  );
}
