'use client';

import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { HabitModal } from '@/components/habit-modal';

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
  const [open, setOpen] = useState(false);

  const handleEdit = (name: string, emoji: string) => {
    onEdit(habit.id, name, emoji);
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

      <div 
        className="flex flex-col items-center cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="text-lg hover:opacity-80 transition-opacity">
          {habit.emoji || '😊'}
        </div>
        <div className="w-full text-center hover:bg-gray-50 py-1 px-2 rounded text-[13px]">
          {habit.name}
        </div>
      </div>

      <HabitModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleEdit}
        onDelete={onDelete}
        initialData={habit}
        title="Edit Habit"
      />
    </div>
  );
}