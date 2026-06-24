import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

interface Memory {
  id: string;
  image: string;
  caption: string;
  date: string;
  userId: string;
}

export default function MemoryWall() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'memories'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Memory))
        .filter(m => m.userId === user.uid);
      setMemories(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!preview || !user) return;
    
    try {
      await addDoc(collection(db, 'memories'), {
        userId: user.uid,
        image: preview,
        caption,
        date: new Date().toISOString()
      });
      setPreview(null);
      setCaption('');
      setIsUploading(false);
      toast.success('Memory saved successfully');
    } catch (error) {
      console.error('Error saving memory:', error);
      toast.error('Failed to save memory');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'memories', id));
      toast.success('Memory deleted');
      if (selectedMemory?.id === id) {
        setSelectedMemory(null);
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast.error('Failed to delete memory');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Memory Wall</h1>
          <p className="text-muted-foreground">Captured moments. Little reminders of a beautiful life.</p>
        </div>
        <Button onClick={() => setIsUploading(!isUploading)} variant="outline" className="glass">
          <Upload className="w-4 h-4 mr-2" /> Add Memory
        </Button>
      </header>

      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="glass p-6 max-w-xl mx-auto space-y-4">
              <div 
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload an image</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              {preview && (
                <div className="space-y-4">
                  <Input 
                    placeholder="Add a caption..." 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="bg-black/50 border-white/10"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => { setPreview(null); setIsUploading(false); }}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save Memory</Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {memories.map((memory) => (
          <motion.div
            key={memory.id}
            layoutId={`card-${memory.id}`}
            className="break-inside-avoid"
            onClick={() => setSelectedMemory(memory)}
          >
            <Card className="glass-card overflow-hidden cursor-pointer group">
              <div className="relative">
                <img src={memory.image} alt={memory.caption} className="w-full h-auto transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm line-clamp-2">{memory.caption}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-white hover:text-destructive hover:bg-black/50 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(memory.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedMemory(null)}
          >
            <div className="absolute top-4 right-4 flex space-x-2 z-50">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-destructive hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(selectedMemory.id);
                }}
              >
                <Trash2 className="w-6 h-6" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10"
                onClick={() => setSelectedMemory(null)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <motion.div
              layoutId={`card-${selectedMemory.id}`}
              className="max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl glass-card flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 overflow-auto bg-black/50 p-4 flex items-center justify-center">
                <img src={selectedMemory.image} alt={selectedMemory.caption} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              </div>
              <div className="p-6 bg-black/80 border-t border-white/10">
                <p className="text-xl text-white">{selectedMemory.caption}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date(selectedMemory.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
