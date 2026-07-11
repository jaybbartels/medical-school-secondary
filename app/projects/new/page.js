'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

export default function NewProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    medical_school_name: '',
    user_background: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
      }
      setUser(user);
    };
    checkAuth();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.title || !formData.medical_school_name || !formData.user_background) {
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
            ...formData
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
        <ArrowLeft size={20} />
        Back to Projects
      </Link>

      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-600 mb-8">Start a new medical school secondary application project</p>

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

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Your Background & Resume
            </label>
            <textarea
              name="user_background"
              value={formData.user_background}
              onChange={handleChange}
              placeholder="Paste your resume, CV, or a summary of your background, accomplishments, clinical experience, research, etc. This helps Claude give personalized recommendations."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-gray-600 text-sm mt-1">
              The more detail you provide, the better and more personalized the recommendations will be
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Creating Project...
              </>
            ) : (
              'Create Project'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
