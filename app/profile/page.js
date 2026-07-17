'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader, Wand2, Save } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

export default function ProfileBuilder() {
  const router = useRouter();
  const [editProfileId, setEditProfileId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [backgroundText, setBackgroundText] = useState('');
  const [profileName, setProfileName] = useState('');
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
    setIsMounted(true);
    
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      
      setUser(user);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('edit');
        
        if (id) {
          setEditProfileId(id);
          
          const { data } = await supabase
            .from('applicant_profiles')
            .select('*')
            .eq('id', id)
            .single();

          if (data) {
            setProfileName(data.name || '');
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
      }
    };
    
    checkAuth();
  }, [router]);

  const inferProfile = async () => {
    if (!backgroundText.trim()) {
      setError('Please enter your background information');
      return;
    }

    if (!profileName.trim()) {
      setError('Please give your profile a name');
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
    if (!user) {
      setError('Session expired. Please sign in again.');
      router.push('/auth');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createBrowserClient();

      // Verify session is still active
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please sign in again.');
        router.push('/auth');
        return;
      }

      if (editProfileId) {
        const { error } = await supabase
          .from('applicant_profiles')
          .update({
            name: profileName,
            clinical_experience: profile.clinical_experience,
            research_experience: profile.research_experience,
            leadership_volunteer: profile.leadership_volunteer,
            career_goals: profile.career_goals,
            personal_values: profile.personal_values,
            unique_story: profile.unique_story,
            skills_accomplishments: profile.skills_accomplishments,
            updated_at: new Date().toISOString()
          })
          .eq('id', editProfileId);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        setSuccess('Profile updated! Redirecting...');
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const { data, error } = await supabase
          .from('applicant_profiles')
          .insert([
            {
              user_id: user.id,
              name: profileName,
              clinical_experience: profile.clinical_experience,
              research_experience: profile.research_experience,
              leadership_volunteer: profile.leadership_volunteer,
              career_goals: profile.career_goals,
              personal_values: profile.personal_values,
              unique_story: profile.unique_story,
              skills_accomplishments: profile.skills_accomplishments
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        setSuccess('Profile created! Redirecting...');
        
        setTimeout(() => {
          router.push('/projects/new?profileId=' + data.id);
        }, 2000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted || !user) {
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
              Give your profile a name, then paste your resume, CV, or background summary. We'll analyze it and extract key information about your experience, goals, and values.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Profile Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g., 'My Main Profile', 'Research-Focused', 'Clinical-Heavy'"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-gray-600 text-sm mt-1">Give this a descriptive name so you can find it later</p>
            </div>

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

            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-900 font-semibold">Profile: {profileName}</p>
            </div>

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
