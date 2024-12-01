"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    const name = formData.get("name") as string;

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, name }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Account created successfully",
      });

      router.push("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Input
            name="email"
            placeholder="Email"
            type="email"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <Input
            name="username"
            placeholder="Username"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <Input
            name="name"
            placeholder="Full Name"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <Input
            name="password"
            placeholder="Password"
            type="password"
            required
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          Register
        </Button>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link 
          href="/login" 
          className="text-primary hover:underline"
        >
          Login here
        </Link>
      </div>
    </div>
  );
} 