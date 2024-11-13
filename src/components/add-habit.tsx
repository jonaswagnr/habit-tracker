'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface AddHabitProps {
  onHabitAdded?: (newHabitId: string) => void;
  className?: string;
}

export function AddHabit({ onHabitAdded, className = '' }: AddHabitProps) {
  const [newHabit, setNewHabit] = useState('');
  const { toast } = useToast();

  const addHabit = async () => {
    if (!newHabit.trim()) return;

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHabit })
      });

      if (!response.ok) {
        throw new Error('Failed to add habit');
      }
      
      const habit = await response.json();
      console.log('New habit created:', habit);
      
      toast({
        title: "Success",
        description: "New habit added successfully",
      });

      setNewHabit('');
      if (habit.id) {
        onHabitAdded?.(habit.id);
      } else {
        console.error('No habit ID received from server');
      }
    } catch (error) {
      console.error('Failed to add habit:', error);
      toast({
        title: "Error",
        description: "Failed to add habit",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        type="text"
        value={newHabit}
        onChange={(e) => setNewHabit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addHabit()}
        placeholder="New Habit"
        className="w-full sm:w-auto sm:max-w-xs"
      />
      <Button onClick={addHabit} size="sm">
        <Plus className="w-4 h-4 mr-1" />
        Add
      </Button>
    </div>
  );
} 