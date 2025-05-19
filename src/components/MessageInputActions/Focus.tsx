import {
  Globe,
  Pencil,
  ScanEye,
  SwatchBook,
  Bot,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Fragment } from 'react';

const focusModes = [
  {
    key: 'webSearch',
    title: 'All',
    icon: <Globe size={20} />,
  },
  {
    key: 'academicSearch',
    title: 'Academic',
    icon: <SwatchBook size={20} />,
  },
  {
    key: 'writingAssistant',
    title: 'Writing',
    icon: <Pencil size={16} />,
  },
  {
    key: 'agentMode',
    title: 'Agent',
    icon: <Bot size={20} />,
  },
];

const Focus = ({
  focusMode,
  setFocusMode,
}: {
  focusMode: string;
  setFocusMode: (mode: string) => void;
}) => {
  return (
    <Popover className="relative w-full max-w-[15rem] md:max-w-md lg:max-w-lg mt-[6.5px]">
      <PopoverButton
        type="button"
        aria-label={`Current focus mode: ${focusModes.find((mode) => mode.key === focusMode)?.title || 'All'}`}
        className="text-black/50 dark:text-white/50 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary active:scale-95 transition duration-200 hover:text-black dark:hover:text-white"
      >
        <div className="flex flex-row items-center space-x-1">
          {focusMode !== 'webSearch' ? (
            focusModes.find((mode) => mode.key === focusMode)?.icon
          ) : (
            <ScanEye size={20} />
          )}
          <p className="text-xs font-medium hidden lg:block">
            {focusMode !== 'webSearch' 
              ? focusModes.find((mode) => mode.key === focusMode)?.title
              : 'Focus'
            }
          </p>
          <ChevronDown size={16} className="ml-1" />
        </div>
      </PopoverButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className="absolute z-10 w-48 left-0">
          <div className="flex flex-col bg-light-primary dark:bg-dark-primary border rounded-2xl border-light-200 dark:border-dark-200 w-full overflow-hidden shadow-lg">
            {focusModes.map((mode, i) => (
              <PopoverButton
                onClick={() => setFocusMode(mode.key)}
                key={i}
                className={cn(
                  'p-2.5 flex flex-row items-center space-x-2 duration-200 cursor-pointer transition',
                  i !== focusModes.length - 1 && 'border-b border-light-200 dark:border-dark-200',
                  focusMode === mode.key
                    ? 'bg-light-secondary dark:bg-dark-secondary'
                    : 'hover:bg-light-secondary dark:hover:bg-dark-secondary',
                )}
              >
                <div className={cn(
                  'flex items-center',
                  focusMode === mode.key
                    ? 'text-[#24A0ED]'
                    : 'text-black dark:text-white'
                )}>
                  {mode.icon}
                </div>
                <p className={cn(
                  'text-sm font-medium',
                  focusMode === mode.key
                    ? 'text-[#24A0ED]'
                    : 'text-black dark:text-white'
                )}>
                  {mode.title}
                </p>
              </PopoverButton>
            ))}
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

export default Focus;
