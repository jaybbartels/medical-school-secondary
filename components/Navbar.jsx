'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          MedSecond Assistant
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-700 text-sm">{user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut size={20} />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-50 px-4 py-4 space-y-2">
          {user ? (
            <>
              <p className="text-gray-700 text-sm py-2">{user.email}</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold py-2"
              >
                <LogOut size={20} />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold text-center transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
