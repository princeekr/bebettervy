import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Image as ImageIcon, 
  Menu,
  Lightbulb, 
  Target, 
  Sparkles, 
  Heart, 
  Map 
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-50">
      <h1 className="text-xl font-bold text-gradient">BeBetterVY</h1>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-black border-white/10 p-0 flex flex-col">
          <div className="sr-only">
             <SheetTitle>Navigation Menu</SheetTitle>
             <SheetDescription>Access different sections of BeBetterVY.</SheetDescription>
          </div>
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-gradient">BeBetterVY</h2>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Built by me. For me.</p>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300',
                    isActive 
                      ? 'bg-primary/20 text-primary font-medium' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-start text-muted-foreground hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
