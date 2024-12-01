'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Moon, Sun, Laptop } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function ProfileMenu() {
  const { data: session } = useSession();
  const { setTheme } = useTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
            <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <DropdownMenuItem className="flex flex-col items-start cursor-default">
          <div className="font-medium">{session?.user?.name}</div>
          <div className="text-sm text-muted-foreground">{session?.user?.email}</div>
        </DropdownMenuItem>
        <Link href="/profile" className="w-full">
          <DropdownMenuItem className="w-full">Profile Settings</DropdownMenuItem>
        </Link>
        <Link href="/preferences" className="w-full">
          <DropdownMenuItem className="w-full">Preferences</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="w-full cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 