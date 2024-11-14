import { HabitsProvider } from '@/contexts/habits-context';
import { HabitsLayoutContent } from '@/components/habits-layout-content';

export default function HabitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HabitsProvider>
      <HabitsLayoutContent>
        {children}
      </HabitsLayoutContent>
    </HabitsProvider>
  );
} 