import React from 'react';
import { motion } from 'motion/react';

const BackgroundBlobs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-primary/20 blur-[100px] rounded-full mix-blend-screen"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[20%] -right-[20%] w-[60vw] h-[60vw] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen"
      />
    </div>
  );
};

export default BackgroundBlobs;
