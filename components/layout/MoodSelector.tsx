import { useState } from 'react';
import { cn } from '@/lib/utils';

const moods = [
  { emoji: '😭', label: 'Terrible' },
  { emoji: '😔', label: 'Bad' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '🤩', label: 'Great' },
];

export default function MoodSelector() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-xs text-muted-foreground font-medium px-2">How are you feeling?</span>
      <div className="flex items-center justify-between px-2 bg-white/5 p-2 rounded-xl border border-white/10">
        {moods.map((mood) => (
          <button
            key={mood.label}
            onClick={() => setSelectedMood(mood.label)}
            className={cn(
              "text-2xl transition-all duration-200 focus:outline-none hover:scale-125",
              selectedMood === mood.label ? "scale-125 grayscale-0 opacity-100 drop-shadow-md" : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
            )}
            title={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
