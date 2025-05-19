'use client';

import { Trash } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteChatProps {
  chatId: string;
  chats: any[];
  setChats: (chats: any[]) => void;
}

const DeleteChat = ({ chatId, chats, setChats }: DeleteChatProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete chat');
      }

      setChats(chats.filter((chat) => chat._id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setIsDeleting(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setShowDialog(true)}
        className="p-2 text-black/70 dark:text-white/70 hover:text-red-500 dark:hover:text-red-500 transition-colors rounded-full"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Trash size={15} />
      </motion.button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border border-white/10 bg-black/95 backdrop-blur-sm shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-red-500">Delete Chat</DialogTitle>
              <DialogDescription className="text-white/70">
                Are you sure you want to delete this chat? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex space-x-2 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isDeleting}
                className="rounded-full px-6 border-white/10 hover:bg-white/5 transition-colors"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full px-6 bg-red-500 hover:bg-red-600 transition-colors"
              >
                {isDeleting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteChat;
