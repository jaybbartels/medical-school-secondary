'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

export default function MyProfile() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const loadProfiles = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        setError('Error loading profiles');
      } else {
        setProfiles(data || []);
      }

      setLoading(false);
    };

    loadProfiles();
  }, [router, isMounted]);

  const handleDelete = async (profileId) => {
    if (!confirm('Delete this profile? This cannot be undone.')) return;

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('applicant_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
      setProfiles(profiles.filter(p => p.id !== profileId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
        <ArrowLeft size={20} />
        Back to Home
      </Link>

      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Profiles</h1>
            <p className="text-gray-600 mt-2">Manage your applicant profiles</p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            New Profile
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-6">No profiles created yet</p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Plus size={20} />
              Create Your First Profile
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {profiles.map(profile => (
              <div key={profile.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Updated {new Date(profile.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/profile?edit=${profile.id}`}
                      className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-semibold text-sm transition-colors"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-semibold text-sm transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {profile.career_goals && (
                    <div>
                      <p className="text-gray-600 font-semibold">Career Goals</p>
                      <p className="text-gray-700 line-clamp-2">{profile.career_goals}</p>
                    </div>
                  )}
                  {profile.clinical_experience && (
                    <div>
                      <p className="text-gray-600 font-semibold">Clinical</p>
                      <p className="text-gray-700 line-clamp-2">{profile.clinical_experience}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
