'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, LogIn } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import { createBrowserClient } from '@/lib/supabase';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        fetchProjects();
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchProjects = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Medical School Secondary Assistant
          </h1>
          <p className="text-gray-600 mb-8">
            Get AI-powered personalized strategies for answering your medical school secondary questions.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <LogIn size={20} />
            Sign In to Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">Manage your medical school secondary applications</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first medical school secondary application project to get started
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onUpdate={fetchProjects} />
          ))}
        </div>
      )}
    </div>
  );
}
