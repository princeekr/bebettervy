import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import BackgroundBlobs from './BackgroundBlobs';

export default function AppLayout() {
  const location = useLocation();
  const element = useOutlet();

  return (
    <div className="flex h-[100dvh] bg-black overflow-hidden selection:bg-primary/30 relative">
      <BackgroundBlobs />
      
      <div className="flex h-full w-full z-10 relative">
        <Sidebar />
        
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <MobileNav />
          
          <main className="flex-1 overflow-y-auto scroll-smooth">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full p-4 md:p-8 max-w-7xl mx-auto"
              >
                {element && React.cloneElement(element as React.ReactElement, { key: location.pathname })}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <Toaster theme="dark" className="glass" position="top-center" />
    </div>
  );
}
