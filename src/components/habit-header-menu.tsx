import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(
  () => import('@emoji-mart/react').then((mod) => mod.default),
  { ssr: false }
);

interface HabitHeaderMenuProps {
  habit: {
    id: string;
    name: string;
    emoji?: string;
  };
  onEdit: (id: string, newName: string, emoji?: string) => void;
  onDelete: (id: string) => void;
}

export function HabitHeaderMenu({ habit, onEdit, onDelete }: HabitHeaderMenuProps) {
  const [editName, setEditName] = useState(habit.name);
  const [editEmoji, setEditEmoji] = useState(habit.emoji || '');
  const [open, setOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    setEditEmoji(emoji.native);
    setShowEmojiPicker(false);
  };

  const handleSubmit = () => {
    onEdit(habit.id, editName, editEmoji);
    setOpen(false);
  };

  return (
    <div className="relative group">
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 
                    opacity-0 group-hover:opacity-100 transition-opacity 
                    cursor-move bg-white rounded-md p-1.5 shadow-md
                    border border-gray-200 hover:border-gray-300
                    z-50">
        <GripVertical className="w-4 h-4 text-gray-500 hover:text-gray-700" />
      </div>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <div className="flex flex-col items-center cursor-pointer">
            <div className="text-lg hover:opacity-80 transition-opacity">
              {habit.emoji || '😊'}
            </div>
            <div className="w-full text-center hover:bg-gray-50 py-1 px-2 rounded text-[13px]">
              {habit.name}
            </div>
          </div>
        </Popover.Trigger>
        
        <Popover.Portal>
          <Popover.Content className="bg-white rounded-lg shadow-lg p-4 w-72" sideOffset={5}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Emoji</label>
                <div className="flex items-center gap-2">
                  <div 
                    className="text-2xl cursor-pointer p-2 hover:bg-gray-100 rounded"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {editEmoji || '😊'}
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Save
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(habit.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
            
            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}