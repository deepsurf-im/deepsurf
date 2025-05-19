import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Deepsurf',
  description: 'Chat with the internet, chat with Deepsurf.',
};

export default function Page() {
  return (
    <div>
      <Suspense>
        <ChatWindow />
      </Suspense>
    </div>
  );
}