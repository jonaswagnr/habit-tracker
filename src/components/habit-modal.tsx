'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(
  () => import('@emoji-mart/react').then((mod) => mod.default),
  { ssr: false }
);

interface HabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, emoji: string) => void;
  onDelete?: (id: string) => void;
  initialData?: {
    id: string;
    name: string;
    emoji?: string;
  };
  title: string;
}

export function HabitModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onDelete, 
  initialData,
  title 
}: HabitModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [emoji, setEmoji] = useState(initialData?.emoji ?? '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    setEmoji(emoji.native);
    setShowEmojiPicker(false);
  };

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim(), emoji);
      onOpenChange(false);
      if (!initialData) {
        setName('');
        setEmoji('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Emoji</label>
            <div className="flex items-center gap-2">
              <div 
                className="text-2xl cursor-pointer p-2 hover:bg-gray-100 rounded"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {emoji || '😊'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {showEmojiPicker ? 'Close Picker' : 'Search Emoji'}
              </Button>
            </div>
            
            {showEmojiPicker && (
              <div className="mt-2">
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  set="native"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Habit Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full"
              autoComplete="off"
            />
          </div>
          
          <div className="flex justify-between">
            <Button
              onClick={handleSubmit}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              {initialData ? 'Save' : 'Add'}
            </Button>
            
            {onDelete && initialData && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(initialData.id);
                  onOpenChange(false);
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 