"use client"

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AuthSheet() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
          bg-slate-900/95 hover:bg-slate-900/100 text-white transition-all duration-300 
          group-hover:-translate-y-0.5 border border-white/10 hover:border-white/20
          hover:shadow-md"
        >
          <span className="opacity-90 group-hover:opacity-100 transition-opacity">
            Get Started
          </span>
          <span
            className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
            transition-all duration-300"
          >
            →
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] sm:h-[85vh] rounded-t-[20px] border-slate-800 bg-slate-950"
      >
        <SheetHeader className="mb-8">
          <SheetTitle className="text-2xl text-white">Welcome to Too Doo</SheetTitle>
          <SheetDescription className="text-slate-400">
            Sign in to your account or create a new one to get started.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSignIn} className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900 border-slate-800 text-white h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-900 border-slate-800 text-white h-12"
              required
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <Button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white h-12"
          >
            Sign In
          </Button>
          
          <a href="/auth/signup" className="block w-full">
            <Button
              type="button"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 border border-slate-800"
            >
              Create Account
            </Button>
          </a>
        </form>
      </SheetContent>
    </Sheet>
  );
} 