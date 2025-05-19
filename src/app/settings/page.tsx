'use client';

import { Settings as SettingsIcon, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '@headlessui/react';
import ThemeSwitcher from '@/components/theme/Switcher';
import { ImagesIcon, VideoIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from "next-auth/react";
import SignInButton from "@/components/SignInButton";

interface SettingsType {
  automaticImageSearch: boolean;
  automaticVideoSearch: boolean;
  systemInstructions: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isSaving?: boolean;
  onSave?: (value: string) => void;
}

const Input = ({ className, isSaving, onSave, ...restProps }: InputProps) => {
  return (
    <div className="relative">
      <input
        {...restProps}
        className={cn(
          'bg-light-secondary dark:bg-dark-secondary w-full px-3 py-2 flex items-center overflow-hidden border border-light-200 dark:border-dark-200 dark:text-white rounded-lg text-sm',
          isSaving && 'pr-10',
          className,
        )}
        onBlur={(e) => onSave?.(e.target.value)}
      />
      {isSaving && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2
            size={16}
            className="animate-spin text-black/70 dark:text-white/70"
          />
        </div>
      )}
    </div>
  );
};

interface TextareaProps extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  isSaving?: boolean;
  onSave?: (value: string) => void;
}

const Textarea = ({
  className,
  isSaving,
  onSave,
  ...restProps
}: TextareaProps) => {
  return (
    <div className="relative">
      <textarea
        placeholder="Any special instructions for the LLM"
        className="placeholder:text-sm text-sm w-full flex items-center justify-between p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
        rows={4}
        onBlur={(e) => onSave?.(e.target.value)}
        {...restProps}
      />
      {isSaving && (
        <div className="absolute right-3 top-3">
          <Loader2
            size={16}
            className="animate-spin text-black/70 dark:text-white/70"
          />
        </div>
      )}
    </div>
  );
};

const SettingsSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col space-y-4 p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-xl border border-light-200 dark:border-dark-200">
    <h2 className="text-black/90 dark:text-white/90 font-medium">{title}</h2>
    {children}
  </div>
);

const MemoriesSection = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memories?limit=20');
      const data = await res.json();
      setMemories(data);
    } catch (err) {
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      await fetchMemories();
    } catch (err) {
      // Optionally show error
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SettingsSection title="Memories">
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400">Loading memories...</div>
        ) : memories.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">No memories found.</div>
        ) : (
          <ul className="divide-y divide-light-200 dark:divide-dark-200">
            {memories.map((memory) => (
              <li key={memory.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-black dark:text-white line-clamp-1">{memory.content}</div>
                  <div className="text-xs text-black/50 dark:text-white/50">
                    {new Date(memory.metadata.timestamp).toLocaleString()} | {memory.metadata.type}
                  </div>
                </div>
                <button
                  className="ml-4 p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => handleDelete(memory.id)}
                  disabled={deletingId === memory.id}
                  aria-label="Delete memory"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsSection>
  );
};

const Page = () => {
  const { data: session } = useSession();
  const [config, setConfig] = useState<SettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [automaticImageSearch, setAutomaticImageSearch] = useState(false);
  const [automaticVideoSearch, setAutomaticVideoSearch] = useState(false);
  const [systemInstructions, setSystemInstructions] = useState<string>('');
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const res = await fetch(`/api/config`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = (await res.json()) as SettingsType;
      setConfig(data);

      setAutomaticImageSearch(
        localStorage.getItem('autoImageSearch') === 'true',
      );
      setAutomaticVideoSearch(
        localStorage.getItem('autoVideoSearch') === 'true',
      );

      setSystemInstructions(localStorage.getItem('systemInstructions') || '');

      setIsLoading(false);
    };

    fetchConfig();
  }, []);

  const saveConfig = async (key: string, value: any) => {
    setSavingStates((prev) => ({ ...prev, [key]: true }));

    try {
      const updatedConfig = {
        ...config,
        [key]: value,
      } as SettingsType;

      const response = await fetch(`/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to update config');
      }

      setConfig(updatedConfig);

      if (key === 'automaticImageSearch') {
        localStorage.setItem('autoImageSearch', value.toString());
      } else if (key === 'automaticVideoSearch') {
        localStorage.setItem('autoVideoSearch', value.toString());
      } else if (key === 'systemInstructions') {
        localStorage.setItem('systemInstructions', value);
      }
    } catch (err) {
      console.error('Failed to save:', err);
      setConfig((prev) => ({ ...prev! }));
    } finally {
      setTimeout(() => {
        setSavingStates((prev) => ({ ...prev, [key]: false }));
      }, 500);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-black dark:text-white">Settings</h1>
      
      <div className="flex flex-col space-y-6 pb-28 lg:pb-8">
        {!session ? (
          <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-black">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="rounded-full bg-black p-4 dark:bg-white">
                <SettingsIcon className="h-8 w-8 text-white dark:text-black" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-black dark:text-white">Welcome to Deepsurf</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Sign in to customize your experience, save your preferences, and access all features
                </p>
              </div>
              <div className="w-full max-w-sm">
                <SignInButton />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-black">
              <div className="mb-6">
                <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">Account</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {session.user.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-black dark:text-white">{session.user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</p>
                    </div>
                  </div>
                  <SignInButton />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-row items-center justify-center min-h-[50vh]">
                <svg
                  aria-hidden="true"
                  className="w-8 h-8 text-black fill-white dark:text-white dark:fill-black animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              </div>
            ) : (
              config && (
                <>
                  <SettingsSection title="Automatic Search">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-black rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                            <ImagesIcon
                              size={18}
                              className="text-black dark:text-white"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-black dark:text-white font-medium">
                              Automatic Image Search
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              Automatically search for relevant images in chat
                              responses
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={automaticImageSearch}
                          onChange={(checked) => {
                            setAutomaticImageSearch(checked);
                            saveConfig('automaticImageSearch', checked);
                          }}
                          className={cn(
                            automaticImageSearch
                              ? 'bg-black dark:bg-white'
                              : 'bg-gray-200 dark:bg-gray-800',
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                          )}
                        >
                          <span
                            className={cn(
                              automaticImageSearch
                                ? 'translate-x-6'
                                : 'translate-x-1',
                              'inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black transition-transform',
                            )}
                          />
                        </Switch>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-black rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                            <VideoIcon
                              size={18}
                              className="text-black dark:text-white"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-black dark:text-white font-medium">
                              Automatic Video Search
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              Automatically search for relevant videos in chat
                              responses
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={automaticVideoSearch}
                          onChange={(checked) => {
                            setAutomaticVideoSearch(checked);
                            saveConfig('automaticVideoSearch', checked);
                          }}
                          className={cn(
                            automaticVideoSearch
                              ? 'bg-black dark:bg-white'
                              : 'bg-gray-200 dark:bg-gray-800',
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                          )}
                        >
                          <span
                            className={cn(
                              automaticVideoSearch
                                ? 'translate-x-6'
                                : 'translate-x-1',
                              'inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black transition-transform',
                            )}
                          />
                        </Switch>
                      </div>
                    </div>
                  </SettingsSection>

                  <SettingsSection title="System Instructions">
                    <div className="flex flex-col space-y-4">
                      <Textarea
                        value={systemInstructions}
                        isSaving={savingStates['systemInstructions']}
                        onChange={(e) => {
                          setSystemInstructions(e.target.value);
                        }}
                        onSave={(value) => saveConfig('systemInstructions', value)}
                        className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white"
                      />
                    </div>
                  </SettingsSection>

                  <MemoriesSection />
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Page;
