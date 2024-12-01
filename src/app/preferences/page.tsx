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

  const handleExportCSV = () => {
    try {
      // Headers
      let csv = ['Date,Weekday'];
      habits.forEach(habit => {
        csv[0] += `,${habit.name}`;
      });
      csv[0] += ',Journal';

      // Get all unique dates from all habits
      const allDates = new Set<string>();
      habits.forEach(habit => {
        habit.entries.forEach(entry => {
          allDates.add(formatDate(new Date(entry.date)));
        });
      });

      // Sort dates in descending order
      const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      // Data rows
      sortedDates.forEach(dateStr => {
        const date = new Date(dateStr);
        let row = `${dateStr},${formatWeekday(date)}`;
        
        habits.forEach(habit => {
          const entry = habit.entries.find(e => formatDate(new Date(e.date)) === dateStr);
          const completed = entry?.completed ? '1' : '0';
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
      
      toast({
        title: "Success",
        description: "Data exported successfully as CSV",
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

  const handleExportJSON = () => {
    try {
      const exportData = habits.map(habit => ({
        name: habit.name,
        emoji: habit.emoji,
        entries: habit.entries.map(entry => ({
          date: formatDate(new Date(entry.date)),
          completed: entry.completed,
          journal: entry.journal
        }))
      }));

      downloadFile(
        JSON.stringify(exportData, null, 2),
        'habits.json',
        'application/json'
      );

      toast({
        title: "Success",
        description: "Data exported successfully as JSON",
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
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileContent = await file.text();
      let importData;

      if (file.name.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(fileContent);
          console.log('Parsed JSON:', jsonData);

          if (!Array.isArray(jsonData)) {
            throw new Error('JSON data must be an array');
          }

          // Check the format of the JSON
          if (jsonData[0]?.name && Array.isArray(jsonData[0]?.entries)) {
            // Format is already correct (direct habit objects)
            importData = jsonData;
          } else if (jsonData[0]?.habits) {
            // Old format (habits nested under days)
            const habitNames = new Set<string>();
            jsonData.forEach((day: any) => {
              Object.keys(day.habits).forEach(habitName => {
                habitNames.add(habitName);
              });
            });

            importData = Array.from(habitNames).map(habitName => ({
              name: habitName,
              entries: jsonData.map((day: any) => ({
                date: day.date,
                completed: day.habits[habitName] || false,
                journal: habitName === Array.from(habitNames)[0] ? day.journal : undefined
              }))
            }));
          } else {
            throw new Error('Invalid JSON format: Expected either habit objects or daily habit entries');
          }
        } catch (error) {
          console.error('JSON parsing error:', error);
          throw new Error('Invalid JSON format');
        }
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV content
        const lines = fileContent.split('\n').map(line => line.trim()).filter(Boolean);
        
        if (lines.length === 0) {
          throw new Error('CSV file is empty');
        }

        const headers = lines[0].split(',').map(header => header.trim());
        console.log('CSV Headers:', headers);

        if (!headers.includes('Date')) {
          throw new Error('CSV must include a Date column');
        }

        // Extract habit names (all columns except Date, Weekday, and Journal)
        const habitNames = headers
          .slice(1)  // Skip Date
          .filter(name => name !== 'Weekday' && name !== 'Journal')
          .map(name => name.trim());

        console.log('Detected habits:', habitNames);

        if (habitNames.length === 0) {
          throw new Error('No valid habit columns found in CSV');
        }

        importData = habitNames.map(name => ({
          name,
          entries: []
        }));

        // Process each line
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length !== headers.length) {
            console.warn(`Skipping line ${i + 1}: column count mismatch`);
            continue;
          }

          const date = values[0];
          const journalIndex = headers.indexOf('Journal');
          const journal = journalIndex !== -1 ? values[journalIndex]?.replace(/^"|"$/g, '') : undefined;
          
          habitNames.forEach((_, index) => {
            const headerIndex = headers.indexOf(habitNames[index]);
            if (headerIndex !== -1) {  // Only process if header exists
              const completed = values[headerIndex]?.trim() === '1';
              
              importData[index].entries.push({
                date,
                completed,
                journal: index === 0 ? journal : undefined
              });
            }
          });
        }
      } else {
        throw new Error('Unsupported file format. Please use .csv or .json');
      }

      console.log('Processed import data:', importData);

      if (!importData || importData.length === 0) {
        throw new Error('No valid data to import');
      }

      // Validate the structure of importData
      if (!importData.every(habit => 
        habit.name && 
        Array.isArray(habit.entries) && 
        habit.entries.every((entry: any) => 
          entry.date && 
          typeof entry.completed === 'boolean'
        )
      )) {
        throw new Error('Invalid data structure in import file');
      }

      // Send to API
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habits: importData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Import failed');
      }

      toast({
        title: "Success",
        description: "Data imported successfully",
      });

      // Refresh habits data
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