'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, ChevronLeft, ChevronRight, Edit2, GripVertical, Download, Upload } from 'lucide-react';
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AddHabit } from '@/components/add-habit';
import { useHabits } from '@/contexts/habits-context';

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
      className="border-b border-x-0 p-2 w-[66px] min-w-[66px] max-w-[66px] text-center font-['Avenir_Next'] font-medium"
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

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function HabitTracker() {
  const { isPerformanceSorted } = useHabits();
  const [habits, setHabits] = useState<Habit[]>([]);
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
  const { toast } = useToast();

  // Add this function to calculate habit performance
  const calculateHabitPerformance = (habit: Habit): number => {
    const today = new Date();
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return formatDate(date);
    });

    return habit.entries.filter(entry => 
      last7Days.includes(formatDate(new Date(entry.date))) && 
      entry.completed
    ).length;
  };

  const calculatePerformance = (habit: Habit): number => {
    const last7Days = trackedDays.slice(0, 7);
    const completedCount = last7Days.reduce((count, day) => {
      const isCompleted = habit.entries.some(
        entry => formatDate(new Date(entry.date)) === formatDate(day.date) && entry.completed
      );
      return count + (isCompleted ? 1 : 0);
    }, 0);
    return completedCount / 7;
  };

  const sortedHabits = useMemo(() => {
    if (!isPerformanceSorted) {
      return habits.sort((a, b) => {
        const orderA = habitOrder.indexOf(a.id);
        const orderB = habitOrder.indexOf(b.id);
        return orderA - orderB;
      });
    }

    // Sort by performance (lowest first)
    return [...habits].sort((a, b) => {
      const performanceA = calculatePerformance(a);
      const performanceB = calculatePerformance(b);
      return performanceA - performanceB;
    });
  }, [habits, habitOrder, isPerformanceSorted, trackedDays]);

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
    }
    fetchHabits();
  }, []);

  useEffect(() => {
    if (habitOrder.length > 0) {
      localStorage.setItem('habitOrder', JSON.stringify(habitOrder));
    }
  }, [habitOrder]);

  useEffect(() => {
    if (!isPerformanceSorted) {
      const savedOrder = localStorage.getItem('habitOrder');
      if (savedOrder) {
        setHabitOrder(JSON.parse(savedOrder));
      }
    }
  }, [isPerformanceSorted]);

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
      console.log('Fetched habits:', data);
      setHabits(data);
      
      // Update habitOrder to include all habits while preserving existing order
      setHabitOrder(prevOrder => {
        const allHabitIds = data.map((habit: Habit) => habit.id);
        const newOrder = [
          ...prevOrder,
          ...allHabitIds.filter(id => !prevOrder.includes(id))
        ];
        console.log('Updated habit order:', newOrder);
        return newOrder;
      });
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    }
  };

  useEffect(() => {
    fetchHabits();
    
    // Add event listener for habits changes
    const handleHabitsChanged = () => {
      fetchHabits();
    };
    
    window.addEventListener('habits-changed', handleHabitsChanged);
    
    return () => {
      window.removeEventListener('habits-changed', handleHabitsChanged);
    };
  }, []);

  const removeHabit = async (id: string) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete habit');
      }

      toast({
        title: "Success",
        description: data.message === 'Deleted' ? 
          "Habit deleted successfully" : 
          "Habit deactivated successfully",
      });

      await fetchHabits();
      
      // Update habitOrder by removing the deleted habit
      setHabitOrder(prevOrder => prevOrder.filter(habitId => habitId !== id));

    } catch (error) {
      console.error('Failed to remove habit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove habit",
        variant: "destructive",
      });
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

  const exportToCSV = () => {
    // Headers
    let csv = ['Date,Weekday'];
    sortedHabits.forEach(habit => {
      csv[0] += `,${habit.name}`;
    });
    csv[0] += ',Journal';

    // Data rows
    trackedDays.forEach(day => {
      const dateStr = formatDate(day.date);
      let row = `${dateStr},${formatWeekday(day.date)}`;
      
      sortedHabits.forEach(habit => {
        const completed = isHabitCompleted(habit, day.date) ? '1' : '0';
        row += `,${completed}`;
      });

      // Add journal entry
      const journalEntry = habits[0]?.entries.find(
        e => formatDate(new Date(e.date)) === dateStr
      )?.journal || '';
      row += `,"${journalEntry.replace(/"/g, '""')}"`;  // Escape quotes in journal

      csv.push(row);
    });

    downloadFile(csv.join('\n'), 'habits.csv', 'text/csv');
  };

  const exportToJSON = () => {
    const exportData = trackedDays.map(day => {
      const dateStr = formatDate(day.date);
      const habitData = sortedHabits.reduce((acc, habit) => {
        acc[habit.name] = isHabitCompleted(habit, day.date);
        return acc;
      }, {} as Record<string, boolean>);

      return {
        date: dateStr,
        weekday: formatWeekday(day.date),
        habits: habitData,
        journal: habits[0]?.entries.find(
          e => formatDate(new Date(e.date)) === dateStr
        )?.journal || ''
      };
    });

    downloadFile(
      JSON.stringify(exportData, null, 2),
      'habits.json',
      'application/json'
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      let importData;

      if (file.name.endsWith('.json')) {
        console.log('Parsing JSON file');
        const jsonData = JSON.parse(fileContent);
        
        // Transform JSON data into the expected format
        // First, collect all unique habit names
        const habitNames = new Set<string>();
        jsonData.forEach((day: any) => {
          Object.keys(day.habits).forEach(habitName => {
            habitNames.add(habitName);
          });
        });

        // Then create the habit entries
        importData = Array.from(habitNames).map(habitName => ({
          name: habitName,
          entries: jsonData.map((day: any) => ({
            date: day.date,
            completed: day.habits[habitName] || false,
            journal: day.journal // Journal will only be stored with the first habit
          }))
        }));

        console.log('Transformed JSON data:', importData);
      } else if (file.name.endsWith('.csv')) {
        importData = parseCSV(fileContent);
      } else {
        throw new Error('Unsupported file format');
      }

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habits: importData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      toast({
        title: "Success",
        description: "Data imported successfully",
      });

      // Refresh habits list
      await fetchHabits();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const parseCSV = (content: string) => {
    console.log('Raw CSV content:', content);
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    console.log('CSV headers:', headers);

    // Extract habit names (all columns except Date, Weekday, and Journal)
    const habitNames = headers.slice(1, -1).filter(name => name !== 'Weekday');
    console.log('Detected habits:', habitNames);

    // Initialize habits array
    const habits = habitNames.map(name => ({
      name: name.trim(),
      entries: []
    }));

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const date = values[0];
      const journal = values[values.length - 1]?.replace(/^"|"$/g, '');
      
      // Process each habit's completion status
      habitNames.forEach((_, index) => {
        const valueIndex = index + 2; // +2 to skip Date and Weekday
        const completed = values[valueIndex]?.trim() === '1';
        
        habits[index].entries.push({
          date,
          completed,
          journal: index === 0 ? journal : undefined // Only store journal with first habit
        });
      });
    }

    console.log('Processed CSV data:', habits);
    return habits;
  };

  const handleHabitAdded = async (newHabitId: string) => {
    console.log('New habit added with ID:', newHabitId);
    await fetchHabits(); // This will now handle updating both habits and habitOrder
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
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
                <th className="border-b p-2 w-[80px] min-w-[80px] text-center font-['Avenir_Next'] font-medium text-[13px]">
                  Weekday
                </th>
                <th className="border-b p-2 w-[100px] min-w-[100px] max-w-[100px] text-center font-['Avenir_Next'] font-medium text-[13px]">
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
                <th className="border-b p-2 w-[250px] min-w-[250px] text-center font-['Avenir_Next'] font-medium text-[13px]">
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
                  <td className="border-b border-x-0 p-2 font-medium w-[80px] min-w-[80px] text-center text-[13px]">
                    {formatWeekday(day.date)}
                  </td>
                  <td className="border-b border-x-0 p-2 font-medium w-[100px] min-w-[100px] max-w-[100px] text-center text-[13px]">
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