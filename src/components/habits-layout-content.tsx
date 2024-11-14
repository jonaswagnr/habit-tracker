'use client';

import { AddHabit } from '@/components/add-habit';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useHabits } from '@/contexts/habits-context';
import { ProfileMenu } from '@/components/profile-menu';

export function HabitsLayoutContent({ children }: { children: React.ReactNode }) {
  const { isPerformanceSorted, setIsPerformanceSorted } = useHabits();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-[72px] border-b">
        <div className="max-w-[1920px] mx-auto px-6 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="nugs logo" className="h-8 w-8" />
              <h2 className="text-2xl font-bold">
                nugs
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <AddHabit 
                onHabitAdded={() => {}} 
                className="sm:flex-initial"
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
              
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
} 