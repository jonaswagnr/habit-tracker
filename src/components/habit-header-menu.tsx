import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2, GripVertical } from 'lucide-react';

interface HabitHeaderMenuProps {
  habit: {
    id: string;
    name: string;
  };
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export function HabitHeaderMenu({ habit, onEdit, onDelete }: HabitHeaderMenuProps) {
  const [editName, setEditName] = useState(habit.name);

  return (
    <div className="relative group">
      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 
                    opacity-0 group-hover:opacity-100 transition-opacity 
                    cursor-move bg-white rounded-md p-1.5 shadow-md
                    border border-gray-200 hover:border-gray-300
                    z-10">
        <GripVertical className="w-4 h-4 text-gray-500 hover:text-gray-700" />
      </div>
      <Popover.Root>
        <Popover.Trigger asChild>
          <div className="w-full text-center cursor-pointer hover:bg-gray-50 py-1 px-2 rounded">
            {habit.name}
          </div>
        </Popover.Trigger>
        
        <Popover.Portal>
          <Popover.Content className="bg-white rounded-lg shadow-lg p-4 w-72" sideOffset={5}>
            <div className="space-y-4">
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
                  onClick={() => onEdit(habit.id, editName)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(habit.id)}
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