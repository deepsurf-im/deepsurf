'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-black/70 dark:text-white/70" />
      ) : (
        <Moon className="w-5 h-5 text-black/70 dark:text-white/70" />
      )}
    </motion.button>
  );
};

export default ThemeToggle; 