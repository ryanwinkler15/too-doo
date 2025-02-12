"use client";

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error(error.message);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            toast.error('An error occurred during sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleSignInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                toast.error(error.message);
            }
        } catch (error) {
            toast.error('An error occurred during Google sign in');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <BackgroundPaths 
                title="Too Doo" 
                subtitle="Stay on top. Win each day." 
            />
            
            <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-lg shadow-xl relative z-10">
                <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-900 text-slate-400">Or continue with</span>
                    </div>
                </div>

                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSignInWithGoogle}
                    className="w-full"
                >
                    Sign in with Google
                </Button>
            </div>
        </div>
    );
} 