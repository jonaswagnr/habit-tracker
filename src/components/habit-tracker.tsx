'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  active: boolean;
  entries: HabitEntry[];
}

interface HabitEntry {
  id: string;
  date: string;
  completed: boolean;
  habitId: string;
}

interface TrackedDay {
  date: Date;
}

const START_DATE = new Date('2024-10-24T00:00:00');
const DEFAULT_PAGE_SIZE = 21;
const MAX_PAGE_SIZE = 100;

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [trackedDays, setTrackedDays] = useState<TrackedDay[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalDays, setTotalDays] = useState<TrackedDay[]>([]);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    setIsClient(true);
    initializeDays();
    fetchHabits();
  }, []);

  useEffect(() => {
    updateVisibleDays();
  }, [currentPage, pageSize, totalDays]);

  const initializeDays = () => {
    const days: TrackedDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(START_DATE);
    startDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= diffDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push({ date: new Date(date) });
    }
    
    setTotalDays(days);
    updateVisibleDays();
  };

  const updateVisibleDays = () => {
    const startIdx = currentPage * pageSize;
    const visibleDays = totalDays.slice(startIdx, startIdx + pageSize);
    setTrackedDays(visibleDays);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Math.min(Math.max(1, parseInt(e.target.value) || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      if (!response.ok) throw new Error('Failed to fetch habits');
      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    }
  };

  const addHabit = async () => {
    if (newHabit) {
      try {
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newHabit })
        });
        
        if (!response.ok) throw new Error('Failed to add habit');
        setNewHabit('');
        await fetchHabits();
      } catch (error) {
        console.error('Failed to add habit:', error);
      }
    }
  };

  const removeHabit = async (id: string) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (!response.ok) throw new Error('Failed to delete habit');
      await fetchHabits();
    } catch (error) {
      console.error('Failed to remove habit:', error);
    }
  };

  const startEditing = (habit: Habit) => {
    setEditingHabit(habit.id);
    setEditedName(habit.name);
  };

  const updateHabitName = async (habitId: string) => {
    if (!editedName.trim()) return;
    
    try {
      const response = await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: habitId,
          name: editedName.trim()
        })
      });
      
      if (!response.ok) throw new Error('Failed to update habit');
      setEditingHabit(null);
      await fetchHabits();
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, habitId: string) => {
    if (e.key === 'Enter') {
      updateHabitName(habitId);
    } else if (e.key === 'Escape') {
      setEditingHabit(null);
    }
  };

  const toggleHabit = async (habitId: string, date: Date) => {
    const dateString = formatDate(date);
    const currentEntry = habits
      .find(h => h.id === habitId)
      ?.entries
      ?.find(e => formatDate(new Date(e.date)) === dateString);
    
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          date: dateString,
          completed: !(currentEntry?.completed)
        })
      });
      
      if (!response.ok) throw new Error('Failed to toggle habit');
      await fetchHabits();
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const formatWeekday = (date: Date): string => {
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return weekdays[date.getDay()];
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isHabitCompleted = (habit: Habit, date: Date): boolean => {
    const dateString = formatDate(date);
    return habit.entries?.some(
      entry => formatDate(new Date(entry.date)) === dateString && entry.completed
    );
  };

  const totalPages = Math.ceil(totalDays.length / pageSize);

  if (!isClient) {
    return null;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Habit Tracker
      </h2>
      
      <div className="flex justify-end mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHabit()}
            placeholder="Neuer Habit"
            className="max-w-xs"
          />
          <Button onClick={addHabit} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Hinzufügen
          </Button>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100 w-[150px] min-w-[150px]">Wochentag</th>
              <th className="border p-2 bg-gray-100 w-[150px] min-w-[150px]">Datum</th>
              {habits.map((habit) => (
                <th key={habit.id} className="border p-2 bg-gray-100 w-[150px] min-w-[150px] max-w-[150px]">
                  <div className="flex items-center justify-between group">
                    {editingHabit === habit.id ? (
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, habit.id)}
                        onBlur={() => updateHabitName(habit.id)}
                        className="min-w-0 w-full"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate mr-2">{habit.name}</span>
                        <div className="flex items-center flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(habit)}
                            className="p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHabit(habit.id);
                            }}
                            className="ml-1 p-1 h-6 w-6"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trackedDays.map((day) => {
              const todayCheck = isToday(day.date);
              return (
                <tr key={formatDate(day.date)} className={todayCheck ? 'bg-blue-50' : ''}>
                  <td className="border p-2 font-medium w-[150px] min-w-[150px]">
                    {formatWeekday(day.date)}
                  </td>
                  <td className="border p-2 font-medium w-[150px] min-w-[150px]">
                    {formatDate(day.date)}
                  </td>
                  {habits.map((habit) => (
                    <td
                      key={habit.id}
                      className="border p-2 text-center cursor-pointer hover:bg-gray-50 w-[150px] min-w-[150px] max-w-[150px]"
                      onClick={() => toggleHabit(habit.id, day.date)}
                      style={{
                        backgroundColor: isHabitCompleted(habit, day.date) ? '#86efac' : 'white',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {isHabitCompleted(habit, day.date) ? '✓' : ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="whitespace-nowrap">Zeilen pro Seite:</label>
          <Input
            id="pageSize"
            type="number"
            min="1"
            max={MAX_PAGE_SIZE}
            value={pageSize}
            onChange={handlePageSizeChange}
            className="w-20"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>
            Seite {currentPage + 1} von {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}