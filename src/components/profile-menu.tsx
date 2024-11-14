'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';

interface ProfileMenuProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  avatarFallback?: string;
}

export function ProfileMenu({ 
  userName = "User Name",
  userEmail = "user@example.com",
  avatarUrl = "/avatar.jpg",
  avatarFallback = "US"
}: ProfileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="flex flex-col items-start">
          <div className="font-medium">{userName}</div>
          <div className="text-sm text-muted-foreground">{userEmail}</div>
        </DropdownMenuItem>
        <Link href="/profile">
          <DropdownMenuItem>Profile Settings</DropdownMenuItem>
        </Link>
        <Link href="/preferences">
          <DropdownMenuItem>Preferences</DropdownMenuItem>
        </Link>
        <Separator className="my-1" />
        <DropdownMenuItem className="text-red-600">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 