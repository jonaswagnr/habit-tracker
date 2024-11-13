'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { HabitModal } from '@/components/habit-modal';

interface AddHabitProps {
  onHabitAdded?: (newHabitId: string) => void;
  className?: string;
}

export function AddHabit({ onHabitAdded, className = '' }: AddHabitProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const addHabit = async (name: string, emoji: string) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji })
      });

      if (!response.ok) {
        throw new Error('Failed to add habit');
      }
      
      const habit = await response.json();
      
      toast({
        title: "Success",
        description: "New habit added successfully",
      });

      if (habit.id) {
        onHabitAdded?.(habit.id);
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
    <>
      <Button 
        onClick={() => setOpen(true)} 
        size="sm"
        className={className}
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Habit
      </Button>

      <HabitModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={addHabit}
        title="Add New Habit"
      />
    </>
  );
} 