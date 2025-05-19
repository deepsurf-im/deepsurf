'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpenText, Clock, MessageSquare } from 'lucide-react';

interface Chat {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchChats();
    }
  }, [status, router]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/chats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch chats');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button
          onClick={fetchChats}
          className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen max-w-screen-sm mx-auto p-2 space-y-8">
        <h2 className="text-black/70 dark:text-white/70 text-3xl font-medium -mt-8">
          Your Chats
        </h2>
        <div className="flex flex-col items-center justify-center space-y-4">
          <BookOpenText className="w-12 h-12 text-black/50 dark:text-white/50" />
          <p className="text-black/70 dark:text-white/70 text-lg font-medium">
            No chats yet
          </p>
          <p className="text-black/50 dark:text-white/50 text-sm text-center max-w-md">
            Start a new chat to see your conversation history here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white">Your Chats</h1>
        <Link 
          href="/" 
          className="px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-colors border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          New Chat
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chats.map((chat) => (
          <Link
            key={chat._id}
            href={`/c/${chat._id}`}
            className="block p-6 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-black dark:text-white line-clamp-2">
                {chat.title}
              </h2>
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{new Date(chat.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
