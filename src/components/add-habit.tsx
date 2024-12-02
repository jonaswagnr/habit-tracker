'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { HabitModal } from '@/components/habit-modal';
import { useHabits } from '@/contexts/habits-context';

interface AddHabitProps {
  className?: string;
}

export function AddHabit({ className = '' }: AddHabitProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { refreshHabits } = useHabits();

  const addHabit = async (name: string, emoji: string) => {
    try {
      if (!name.trim()) {
        toast({
          title: "Error",
          description: "Habit name is required",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: name.trim(),
          emoji: emoji || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add habit');
      }
      
      toast({
        title: "Success",
        description: "Habit added successfully",
      });

      setOpen(false);
      refreshHabits();
    } catch (error) {
      console.error('Failed to add habit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add habit",
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