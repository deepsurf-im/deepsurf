import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Waitlist - Deepsurf',
  description: 'Join the Deepsurf waitlist to get early access to the future of AI-powered web search.',
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 