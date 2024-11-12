'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, ChevronLeft, ChevronRight, Edit2, GripVertical } from 'lucide-react';
import debounce from 'lodash/debounce';
import { HabitHeaderMenu } from '@/components/habit-header-menu';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Habit {
  id: string;
  name: string;
  active: boolean;
  entries: HabitEntry[];
  emoji?: string;
}

interface HabitEntry {
  id: string;
  date: string;
  completed: boolean;
  habitId: string;
  journal?: string;
}

interface TrackedDay {
  date: Date;
}

const START_DATE = new Date('2024-10-24T00:00:00');
const DEFAULT_PAGE_SIZE = 21;
const MAX_PAGE_SIZE = 100;

interface SortableHabitHeaderProps {
  habit: {
    id: string;
    name: string;
  };
  onEdit: (id: string, newName: string, emoji: string) => void;
  onDelete: (id: string) => void;
}

function SortableHabitHeader({ habit, onEdit, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th 
      ref={setNodeRef}
      style={style}
      className="border-t border-b border-x-0 p-2 w-[66px] min-w-[66px] max-w-[66px] text-center font-['Avenir_Next'] font-medium"
      {...attributes}
      {...listeners}
    >
      <HabitHeaderMenu
        habit={habit}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </th>
  );
}

// Direkt nach den Interfaces und vor der HabitTracker-Komponente:
const STREAK_COLORS = ["b7efc5", "92e6a7", "6ede8a", "4ad66d", "2dc653", "25a244", "208b3a", "1a7431", "155d27", "10451d"];

// Hilfsfunktionen vor der HabitTracker-Komponente definieren
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateStreak = (habit: Habit, date: Date): number => {
  let streak = 0;
  let currentDate = new Date(date);
  
  while (true) {
    const isCompleted = habit.entries?.some(
      entry => formatDate(new Date(entry.date)) === formatDate(currentDate) && entry.completed
    );
    
    if (!isCompleted) break;
    
    streak++;
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

const getStreakColor = (habit: Habit, date: Date): string => {
  const streak = calculateStreak(habit, date);
  if (streak === 0) return 'white';
  
  const colorIndex = Math.min(streak - 1, STREAK_COLORS.length - 1);
  return `#${STREAK_COLORS[colorIndex]}`;
};

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
  const [journalDrafts, setJournalDrafts] = useState<Record<string, string>>({});
  const [debouncedUpdate] = useState(() => 
    debounce((date: Date, journal: string) => {
      updateJournal(date, journal);
    }, 1000)
  );
  const [habitOrder, setHabitOrder] = useState<string[]>([]);

  // Sortierte Habits
  const sortedHabits = useMemo(() => {
    return habitOrder
      .map(id => habits.find(h => h.id === id))
      .filter((h): h is Habit => h !== undefined);
  }, [habits, habitOrder]);

  // Berechne die minimale Tabellenbreite
  const minTableWidth = useMemo(() => {
    return 80 + 100 + (sortedHabits.length * 66) + 250; // weekday + date + habits + journal
  }, [sortedHabits.length]);

  useEffect(() => {
    setIsClient(true);
    initializeDays();
    fetchHabits();
  }, []);

  useEffect(() => {
    updateVisibleDays();
  }, [currentPage, pageSize, totalDays]);

  useEffect(() => {
    const savedOrder = localStorage.getItem('habitOrder');
    if (savedOrder) {
      setHabitOrder(JSON.parse(savedOrder));
    } else {
      setHabitOrder(habits.map(h => h.id));
    }
  }, [habits]);

  useEffect(() => {
    if (habitOrder.length > 0) {
      localStorage.setItem('habitOrder', JSON.stringify(habitOrder));
    }
  }, [habitOrder]);

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
    if (!newHabit.trim()) return;

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHabit })
      });

      if (!response.ok) throw new Error('Failed to add habit');
      
      const habit = await response.json();
      
      // Aktualisiere die habitOrder mit der neuen Habit-ID
      setHabitOrder(prevOrder => [...prevOrder, habit.id]);
      
      await fetchHabits();
      setNewHabit('');
    } catch (error) {
      console.error('Failed to add habit:', error);
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

  const updateHabitName = async (id: string, newName: string, emoji: string) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          name: newName,
          emoji 
        })
      });

      if (!response.ok) throw new Error('Failed to update habit');
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
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

  const updateJournal = async (date: Date, journal: string) => {
    try {
      const primaryHabit = habits[0];
      if (!primaryHabit) return;

      console.log('Updating journal:', { date, journal, habitId: primaryHabit.id });

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId: primaryHabit.id,
          date: formatDate(date),
          completed: isHabitCompleted(primaryHabit, date),
          journal: journal
        })
      });
      
      if (!response.ok) {
        console.error('Server response not ok:', await response.text());
        throw new Error('Failed to update journal');
      }

      const responseData = await response.json();
      console.log('Server response:', responseData);
      
      await fetchHabits();
    } catch (error) {
      console.error('Failed to update journal:', error);
    }
  };

  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const handleJournalChange = (date: Date, value: string) => {
    console.log('Journal change:', { date, value });
    const dateKey = formatDate(date);
    setJournalDrafts(prev => ({
      ...prev,
      [dateKey]: value
    }));
    debouncedUpdate(date, value);
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 ist Sonntag, 6 ist Samstag
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: any) => {
    const {active, over} = event;
    
    if (active.id !== over.id) {
      setHabitOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
        <h2 className="text-4xl font-bold">
          Quantified Self
        </h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
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
      </div>

      <div className="w-full overflow-x-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table 
            className="border-collapse w-full" 
            style={{ minWidth: `${minTableWidth}px` }}
          >
            <thead>
              <tr>
                <th className="border-t border-b border-x-0 p-2 w-[80px] min-w-[80px] text-center font-['Avenir_Next'] font-medium">
                  Weekday
                </th>
                <th className="border-t border-b border-x-0 p-2 w-[100px] min-w-[100px] max-w-[100px] text-center font-['Avenir_Next'] font-medium">
                  Date
                </th>
                <SortableContext 
                  items={habitOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {sortedHabits.map((habit) => (
                    <SortableHabitHeader
                      key={habit.id}
                      habit={habit}
                      onEdit={updateHabitName}
                      onDelete={removeHabit}
                    />
                  ))}
                </SortableContext>
                <th className="border-t border-b border-x-0 p-2 w-[250px] min-w-[250px] text-center font-['Avenir_Next'] font-medium">
                  Journal
                </th>
              </tr>
            </thead>
            <tbody>
              {trackedDays.map((day) => (
                <tr 
                  key={formatDate(day.date)}
                  style={{
                    backgroundColor: isWeekend(day.date) ? '#f4f4f4' : 'white'
                  }}
                >
                  <td className="border-b border-x-0 p-2 font-medium w-[80px] min-w-[80px] text-center">
                    {formatWeekday(day.date)}
                  </td>
                  <td className="border-b border-x-0 p-2 font-medium w-[100px] min-w-[100px] max-w-[100px] text-center">
                    {formatDate(day.date)}
                  </td>
                  {sortedHabits.map((habit) => (
                    <td
                      key={habit.id}
                      className={`p-2 text-center cursor-pointer hover:bg-gray-50 w-[66px] min-w-[66px] max-w-[66px] ${
                        isHabitCompleted(habit, day.date) 
                          ? '' // Keine border wenn completed
                          : 'border-b border-x-0' // border nur wenn nicht completed
                      }`}
                      onClick={() => toggleHabit(habit.id, day.date)}
                      style={{
                        backgroundColor: isHabitCompleted(habit, day.date) 
                          ? getStreakColor(habit, day.date)
                          : isWeekend(day.date) ? '#f4f4f4' : 'white',
                        transition: 'background-color 0.2s'
                      }}
                    />
                  ))}
                  <td className="border-b border-x-0 p-0 w-[250px] min-w-[250px]">
                    <textarea
                      value={journalDrafts[formatDate(day.date)] ?? habits[0]?.entries.find(e => formatDate(new Date(e.date)) === formatDate(day.date))?.journal ?? ''}
                      onChange={(e) => handleJournalChange(day.date, e.target.value)}
                      onBlur={(e) => updateJournal(day.date, e.target.value)}
                      placeholder="..."
                      className="w-full h-full min-h-[38px] p-2 border-none resize-y focus:outline-none focus:ring-0 text-[80%]"
                      style={{
                        backgroundColor: isWeekend(day.date) ? '#f4f4f4' : 'white',
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DndContext>
      </div>

      <div className="px-6 py-4">
        <div className="flex justify-end items-center gap-4">
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
    </div>
  );
}