'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from "next-themes"
import { useRouter } from 'next/navigation';
import { ProfileSettings } from "@/components/profile-settings";

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
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleExportJSON = async () => {
    try {
      const response = await fetch('/api/habits');
      const habits = await response.json();

      // Sort habits by order before export
      const sortedHabits = habits.sort((a: any, b: any) => a.order - b.order);

      const exportData = sortedHabits.map((habit: any) => ({
        name: habit.name,
        emoji: habit.emoji,
        order: habit.order,
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
      
      if (!fileContent.trim()) {
        throw new Error('File is empty');
      }

      let importData;
      try {
        if (!fileContent.startsWith('[') && !fileContent.startsWith('{')) {
          throw new Error('Invalid JSON format: must start with [ or {');
        }

        const parsedData = JSON.parse(fileContent);
        console.log('Parsed JSON:', parsedData);

        // If the data is already in the correct format (array of habits)
        const habitsArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        
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

      // Send to API
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Import failed');
      }

      toast({
        title: "Success",
        description: "Data imported successfully",
      });

      // Force a hard refresh of the page
      router.refresh();
      
      // Optionally, redirect to habits page to see the changes
      router.push('/habits');

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
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Manage your profile settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileSettings />
          </CardContent>
        </Card>

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
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your data backup and restore options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleExportJSON} 
                className="w-full flex items-center justify-center gap-2 h-10"
              >
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 h-10"
                  >
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
                      <Label htmlFor="file-upload">
                        Choose a file to import
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                      />
                      <p className="text-sm text-muted-foreground">
                        Supported format: JSON
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