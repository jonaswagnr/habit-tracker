'use client';

import { AddHabit } from '@/components/add-habit';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Download, Upload } from 'lucide-react';
import { useHabits } from '@/contexts/habits-context';

export function HabitsLayoutContent({ children }: { children: React.ReactNode }) {
  const { isPerformanceSorted, setIsPerformanceSorted } = useHabits();

  return (
    <div className="min-h-screen font-['Avenir_Next']">
      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2 border-b">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="nugs logo" className="h-8 w-8" />
          <h2 className="text-2xl font-bold">
            nugs
          </h2>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <AddHabit 
            onHabitAdded={() => {}} 
            className="flex-1 sm:flex-initial"
          />
          
          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          
          <div className="flex items-center space-x-2">
            <Switch
              id="performance-sort"
              checked={isPerformanceSorted}
              onCheckedChange={setIsPerformanceSorted}
            />
            <Label htmlFor="performance-sort" className="text-sm">
              Focus Mode
            </Label>
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          
          <div className="flex items-center gap-2">
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
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem className="text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <main className="w-full">
        {children}
      </main>
    </div>
  );
} 