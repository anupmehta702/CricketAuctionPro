
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate, Link } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';

const SUPABASE_URL = 'https://yvauqnrtyhgtgfixyoqv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YXVxbnJ0eWhndGdmaXh5b3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTQ5MjUsImV4cCI6MjA4NzczMDkyNX0.d7u2qgiSNloLFlHeAtc2hBeXaWKtOmNCXDW4HR-SXaQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { login } = useAuction();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, role, email')
                .eq('username', username)
                .single();

            if (profileError) {
                throw new Error('Invalid username or password');
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password,
            });

            if (signInError) {
                throw new Error(signInError.message);
            }

            login({ id: profile.id, username: profile.username, role: profile.role });
            navigate('/landing');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-display text-white">Auction Manager</h1>
                    <p className="text-slate-400 text-sm mt-2">Sign in to continue</p>
                </div>

                <form onSubmit={handleLogin} className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center rounded-lg p-3">
                            {error}
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:grayscale text-white font-bold py-3 px-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-xs text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/create-account" className="font-bold text-blue-400 hover:underline">
                                Create one
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
