import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Image as ImageIcon, 
  Lightbulb, 
  Target, 
  Sparkles, 
  Heart, 
  Map 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import MoodSelector from './MoodSelector';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/journal', label: 'Daily Journal', icon: BookOpen },
  { path: '/memories', label: 'Memory Wall', icon: ImageIcon },
  { path: '/motivation', label: 'Motivation Vault', icon: Lightbulb },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/journey', label: 'My Journey', icon: Map },
];

import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function Sidebar() {
  const { logout } = useAuth();
  
  return (
    <div className="w-64 h-[100dvh] hidden md:flex flex-col border-r border-white/10 glass">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gradient tracking-tight mb-2">BeBetterVY</h1>
        <p className="text-xs text-muted-foreground font-mono">Built by me. For me.</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group',
                isActive 
                  ? 'text-primary font-medium' 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn('w-5 h-5 relative z-10 transition-transform group-hover:scale-110', isActive && 'text-primary')} />
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-white/10 space-y-4">
        <MoodSelector />
        <button
          onClick={logout}
          className="w-full flex items-center justify-start text-muted-foreground hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sign Out</span>
        </button>
        <div className="text-xs text-muted-foreground text-center pt-2">
          Becoming better every day.
        </div>
      </div>
    </div>
  );
}
