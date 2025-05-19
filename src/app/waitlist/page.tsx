'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Mail, CheckCircle2, Twitter } from 'lucide-react';
import { toast } from 'sonner';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to join waitlist');
      }

      setIsSubmitted(true);
      toast.success('Successfully joined the waitlist!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl text-center space-y-8"
      >
        <div className="flex flex-col items-center space-y-4">
          {mounted && (
            <Image
              src={theme === 'dark' ? '/favicon.svg' : '/favicon-dark.svg'}
              alt="Deepsurf Logo"
              width={80}
              height={80}
              priority
              className="mb-1"
            />
          )}
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Leave it to Deepsurf
          </h1>
          <p className="text-lg text-black/70 dark:text-white/70 max-w-xl">
            Be among the first to experience the future of AI-powered web search. 
            Sign up now to get notified when we launch.
          </p>
        </div>
        {!isSubmitted ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <div className="relative w-full sm:w-96">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/50 dark:text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
              />
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </motion.div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4 p-6 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-xl border border-light-200 dark:border-dark-200"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              You&apos;re on the list!
            </h2>
            <p className="text-black/70 dark:text-white/70">
              Thanks for joining our waitlist. We&apos;ll notify you when it&apos;s your turn to experience Deepsurf.
            </p>
          </motion.div>
        )}
        <div className="mt-8">
          <a
            href="https://x.com/deepsurfapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Follow us on X</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}