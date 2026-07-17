'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader, Plus } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

export default function NewProject() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [schoolSpecificNotes, setSchoolSpecificNotes] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    medical_school_name: '',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('id, name, career_goals, clinical_experience')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        setError('Error loading profiles');
      } else {
        setProfiles(data || []);
        if (data && data.length > 0) {
          setSelectedProfileId(data[0].id);
        }
      }
    };

    checkAuth();
  }, [router, isMounted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContinueToNotes = () => {
    if (!selectedProfileId) {
      setError('Please select a profile');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleContinueToSchool = () => {
    setError('');
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.title || !formData.medical_school_name) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const supabase = createBrowserClient();
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            profile_id: selectedProfileId,
            title: formData.title,
            medical_school_name: formData.medical_school_name,
            user_background: '',
            school_specific_notes: schoolSpecificNotes
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create project');
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
        <ArrowLeft size={20} />
        Back to Projects
      </Link>

      <div className="bg-white rounded-lg shadow p-8">
        
        {/* STEP 1: SELECT PROFILE */}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Your Profile</h1>
            <p className="text-gray-600 mb-8">Choose which applicant profile to use for this school application</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {profiles.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-blue-800 mb-4">You haven't created a profile yet.</p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Create Profile First
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {profiles.map(profile => (
                    <div
                      key={profile.id}
                      onClick={() => setSelectedProfileId(profile.id)}
                      className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProfileId === profile.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedProfileId === profile.id
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedProfileId === profile.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{profile.name}</h3>
                          {profile.career_goals && (
                            <p className="text-sm text-gray-600">Goal: {profile.career_goals.substring(0, 100)}...</p>
                          )}
                          {profile.clinical_experience && (
                            <p className="text-sm text-gray-600">Clinical: {profile.clinical_experience.substring(0, 100)}...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleContinueToNotes}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </>
            )}
          </>
        )}

        {/* STEP 2: SCHOOL-SPECIFIC NOTES */}
        {step === 2 && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">School-Specific Information</h1>
            <p className="text-gray-600 mb-8">
              Add any school-specific details that should be considered for your response strategy (optional)
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                School-Specific Notes (Optional)
              </label>
              <textarea
                value={schoolSpecificNotes}
                onChange={(e) => setSchoolSpecificNotes(e.target.value)}
                placeholder="E.g., 'I have family ties to this area', 'Interested in their rural medicine program', 'Want to use their research facilities for X project', etc."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-gray-600 text-sm mt-2">
                This information will help Claude understand your specific connection to this school
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleContinueToSchool}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* STEP 3: SCHOOL & QUESTIONS */}
        {step === 3 && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
            <p className="text-gray-600 mb-8">Enter the medical school name and secondary questions</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Harvard Secondary 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-gray-600 text-sm mt-1">A name to help you organize this project</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Medical School Name
                </label>
                <input
                  type="text"
                  name="medical_school_name"
                  value={formData.medical_school_name}
                  onChange={handleChange}
                  placeholder="e.g., Harvard Medical School"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-gray-600 text-sm mt-1">The medical school you're applying to</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
