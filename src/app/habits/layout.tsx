'use client';

import { AddHabit } from '@/components/add-habit';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { HabitsProvider } from '@/contexts/habits-context';

export default function HabitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPerformanceSorted, setIsPerformanceSorted] = useState(false);
  const { toast } = useToast();

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/habits');
      const habits = await response.json();
      // ... CSV export logic ...
      toast({
        title: "Success",
        description: "Data exported as CSV",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const exportToJSON = async () => {
    try {
      const response = await fetch('/api/habits');
      const habits = await response.json();
      const exportData = {
        habits: habits.map((habit: any) => ({
          name: habit.name,
          emoji: habit.emoji,
          entries: habit.entries
        }))
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'habits-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported as JSON",
      });
    } catch (error) {
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
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      toast({
        title: "Success",
        description: "Data imported successfully",
      });

      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import data",
        variant: "destructive",
      });
    }
  };

  return (
    <HabitsProvider>
      <div className="min-h-screen font-['Avenir_Next']">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link href="/habits" className="flex items-center gap-2">
                  <img src="/logo.svg" alt="nugs logo" className="h-8 w-8" />
                  <h1 className="text-2xl font-bold">nugs</h1>
                </Link>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="focus-mode"
                    checked={isPerformanceSorted}
                    onCheckedChange={setIsPerformanceSorted}
                  />
                  <Label htmlFor="focus-mode" className="text-sm">Focus Mode</Label>
                </div>

                <AddHabit className="hidden sm:flex" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatar.jpg" alt="Profile" />
                        <AvatarFallback>US</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="flex flex-col items-start">
                      <div className="font-medium">User Name</div>
                      <div className="text-sm text-muted-foreground">user@example.com</div>
                    </DropdownMenuItem>
                    <Link href="/preferences">
                      <DropdownMenuItem>
                        Profile Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/preferences">
                      <DropdownMenuItem>
                        Preferences
                      </DropdownMenuItem>
                    </Link>
                    <Separator className="my-1" />
                    <DropdownMenuItem onClick={exportToCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToJSON}>
                      <Download className="w-4 h-4 mr-2" />
                      Export as JSON
                    </DropdownMenuItem>
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Data
                        </DropdownMenuItem>
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
                    <Separator className="my-1" />
                    <DropdownMenuItem className="text-red-600">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </HabitsProvider>
  );
} 