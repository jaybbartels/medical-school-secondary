'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader, Wand2, Save } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

export default function ProfileBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProfileId = searchParams.get('edit');
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [backgroundText, setBackgroundText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profile, setProfile] = useState({
    clinical_experience: '',
    research_experience: '',
    leadership_volunteer: '',
    career_goals: '',
    personal_values: '',
    unique_story: '',
    skills_accomplishments: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/auth');
      setUser(user);

      // If editing existing profile, load it
      if (editProfileId) {
        const { data, error } = await supabase
          .from('applicant_profiles')
          .select('*')
          .eq('id', editProfileId)
          .eq('user_id', user.id)
          .single();

        if (data) {
          setProfile({
            clinical_experience: data.clinical_experience || '',
            research_experience: data.research_experience || '',
            leadership_volunteer: data.leadership_volunteer || '',
            career_goals: data.career_goals || '',
            personal_values: data.personal_values || '',
            unique_story: data.unique_story || '',
            skills_accomplishments: data.skills_accomplishments || ''
          });
          setStep(2);
        }
      }
    };
    checkAuth();
  }, [router, editProfileId]);

  const inferProfile = async () => {
    if (!backgroundText.trim()) {
      setError('Please enter your background information');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/infer-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundText })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setProfile(data.profile);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createBrowserClient();

      if (editProfileId) {
        // Update existing profile
        const { error } = await supabase
          .from('applicant_profiles')
          .update({
            ...profile,
            updated_at: new Date().toISOString()
          })
          .eq('id', editProfileId);

        if (error) throw error;
        setSuccess('Profile updated! You can now re-run your applications to get updated recommendations.');
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('applicant_profiles')
          .insert([profile])
          .select()
          .single();

        if (error) throw error;

        setSuccess('Profile created! Now add your first school.');
        
        setTimeout(() => {
          router.push('/projects/new?profileId=' + data.id);
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Your Applicant Profile</h1>
            <p className="text-gray-600 mb-8">
              Paste your resume, CV, or background summary. We'll analyze it and extract key information about your experience, goals, and values. You can edit everything after!
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Your Background & Resume
              </label>
              <textarea
                value={backgroundText}
                onChange={(e) => setBackgroundText(e.target.value)}
                placeholder="Paste your resume, CV, or background summary here. Include education, clinical experience, research, volunteering, achievements, etc."
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <button
              onClick={inferProfile}
              disabled={loading}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Analyzing Your Profile...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Infer Profile from Resume
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Profile</h1>
            <p className="text-gray-600 mb-8">
              Here's what we extracted from your background. Edit anything that needs updating!
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <div className="space-y-6">
              {Object.entries(profile).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </label>
                  <textarea
                    value={value}
                    onChange={(e) => handleProfileChange(key, e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {editProfileId ? 'Update Profile' : 'Save Profile & Continue'}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
