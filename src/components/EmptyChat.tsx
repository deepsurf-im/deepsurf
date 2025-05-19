import { Settings } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import { useState } from 'react';
import { File } from './ChatWindow';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const EmptyChat = ({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="relative">
      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <Link href="/settings" aria-label="Settings">
          <Settings className="cursor-pointer lg:hidden text-black dark:text-white" />
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen max-w-screen-sm mx-auto p-2 space-y-8">
        <div className="flex flex-row items-center space-x-4">
          <Image 
            src={theme === 'dark' ? '/favicon.svg' : '/favicon-dark.svg'}
            alt="Deepsurf Logo" 
            width={52} 
            height={52} 
            priority
          />
          <h2 className="text-black/70 dark:text-white/70 text-3xl font-medium">
            Deepsurf
          </h2>
        </div>
        <EmptyChatMessageInput
          sendMessage={sendMessage}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          optimizationMode={optimizationMode}
          setOptimizationMode={setOptimizationMode}
          fileIds={fileIds}
          setFileIds={setFileIds}
          files={files}
          setFiles={setFiles}
        />
      </div>
    </div>
  );
};

export default EmptyChat;
