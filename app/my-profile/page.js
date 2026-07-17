'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Loader } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

export default function MyProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
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
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        setError('Error loading profile');
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleDelete = async () => {
    if (!confirm('Delete your profile? This cannot be undone.')) return;

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('applicant_profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
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

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Applicant Profile</h1>
            <p className="text-gray-600 mt-2">
              Last updated {profile ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/profile?edit=${profile?.id || ''}`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Edit size={20} />
              Edit
            </Link>
            {profile && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <Trash2 size={20} />
                Delete
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {profile ? (
          <div className="space-y-8">
            {Object.entries(profile).map(([key, value]) => {
              if (key === 'id' || key === 'user_id' || key === 'created_at' || key === 'updated_at') return null;
              
              return (
                <div key={key}>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{value || 'Not provided'}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">No profile created yet</p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
