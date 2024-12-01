'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from "next-themes"

interface Habit {
  id: string;
  name: string;
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

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatWeekday = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
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

export default function PreferencesPage() {
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      if (!response.ok) throw new Error('Failed to fetch habits');
      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error('Failed to fetch habits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch habits data",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/habits');
      const habits = await response.json();

      // Sort habits by order
      const sortedHabits = habits.sort((a: any, b: any) => a.order - b.order);

      // Get all unique dates
      const dates = new Set<string>();
      sortedHabits.forEach((habit: any) => {
        habit.entries.forEach((entry: any) => {
          dates.add(entry.date.split('T')[0]);
        });
      });

      const sortedDates = Array.from(dates).sort();

      // Create CSV headers
      const headers = ['Date', 'Weekday', ...sortedHabits.map((h: any) => h.name), 'Journal'];
      const rows = [headers.join(',')];

      // Create rows for each date
      sortedDates.forEach(date => {
        const row = [date];
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        row.push(dayOfWeek);

        // Add completion status for each habit
        sortedHabits.forEach((habit: any) => {
          const entry = habit.entries.find((e: any) => e.date.startsWith(date));
          row.push(entry?.completed ? '1' : '0');
        });

        // Add journal entry (from the first habit that has one for this date)
        const journalEntry = sortedHabits
          .map((habit: any) => habit.entries.find((e: any) => e.date.startsWith(date))?.journal)
          .find((journal: string) => journal) || '';
        row.push(`"${journalEntry.replace(/"/g, '""')}"`);

        rows.push(row.join(','));
      });

      // Create and download CSV file
      const csv = rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habits-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await fetch('/api/habits');
      const habits = await response.json();

      // Sort habits by order before export
      const sortedHabits = habits.sort((a: any, b: any) => a.order - b.order);

      const exportData = sortedHabits.map((habit: any) => ({
        name: habit.name,
        emoji: habit.emoji,
        order: habit.order, // Include order in export
        entries: habit.entries.map((entry: any) => ({
          date: entry.date,
          completed: entry.completed,
          journal: entry.journal
        }))
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habits-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      
      // Validate file content
      if (!fileContent.trim()) {
        throw new Error('File is empty');
      }

      let importData;
      if (file.name.endsWith('.json')) {
        try {
          // First validate JSON structure
          if (!fileContent.startsWith('[') && !fileContent.startsWith('{')) {
            throw new Error('Invalid JSON format: must start with [ or {');
          }

          const parsedData = JSON.parse(fileContent);
          console.log('Parsed JSON:', parsedData);

          // Validate the parsed data structure
          const habitsArray = Array.isArray(parsedData) ? parsedData : parsedData.habits;
          
          if (!Array.isArray(habitsArray)) {
            throw new Error('Invalid JSON format: expected array of habits');
          }

          // Validate each habit object
          habitsArray.forEach((habit, index) => {
            if (!habit.name) {
              throw new Error(`Habit at index ${index} is missing a name`);
            }
            if (!Array.isArray(habit.entries)) {
              throw new Error(`Habit "${habit.name}" is missing entries array`);
            }
            habit.entries.forEach((entry, entryIndex) => {
              if (!entry.date) {
                throw new Error(`Entry ${entryIndex} in habit "${habit.name}" is missing a date`);
              }
              // Validate date format
              const date = new Date(entry.date);
              if (isNaN(date.getTime())) {
                throw new Error(`Invalid date format in habit "${habit.name}": ${entry.date}`);
              }
            });
          });

          // Format the data
          importData = {
            habits: habitsArray.map(habit => ({
              name: habit.name.trim(),
              emoji: habit.emoji || '',
              order: typeof habit.order === 'number' ? habit.order : undefined,
              entries: (habit.entries || []).map(entry => ({
                date: new Date(entry.date).toISOString().split('T')[0],
                completed: Boolean(entry.completed),
                journal: (entry.journal || '').trim()
              }))
            }))
          };

          console.log('Formatted import data:', importData);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          throw new Error(
            parseError instanceof Error 
              ? `JSON parsing error: ${parseError.message}` 
              : 'Invalid JSON format'
          );
        }
      } else {
        throw new Error('Unsupported file format. Please use .json');
      }

      // Validate final data structure
      if (!importData?.habits?.length) {
        throw new Error('No valid habits found in import file');
      }

      // Send to API
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      });

      let responseData;
      try {
        responseData = await response.json();
        console.log('API response:', responseData);
      } catch (error) {
        console.error('Error parsing API response:', error);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Import failed');
      }

      toast({
        title: "Success",
        description: "Data imported successfully",
      });

      // Refresh habits if needed
      if (typeof fetchHabits === 'function') {
        await fetchHabits();
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    }

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Preferences</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how nugs looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch 
                id="dark-mode" 
                checked={theme === "dark"}
                onCheckedChange={(checked) => {
                  setTheme(checked ? "dark" : "light")
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-reminder">Daily Reminder</Label>
              <Switch id="daily-reminder" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your data and export options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-backup">Automatic Backup</Label>
              <Switch id="auto-backup" />
            </div>
            
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex gap-2">
                <Button onClick={handleExportCSV} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export as CSV
                </Button>
                <Button onClick={handleExportJSON} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export as JSON
                </Button>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="file-upload" className="text-sm font-medium">
                        Choose a file to import
                      </label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileUpload}
                      />
                      <p className="text-sm text-muted-foreground">
                        Supported formats: CSV, JSON
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 