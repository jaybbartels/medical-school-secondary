'use client';

import Link from 'next/link';
import { Trash2, ChevronRight } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { useState } from 'react';

export default function ProjectCard({ project, onUpdate }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setDeleting(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      alert('Error deleting project: ' + error.message);
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex-1 break-words">{project.title}</h3>
          <button onClick={handleDelete} disabled={deleting} className="text-red-600 hover:text-red-700 disabled:text-gray-400 transition-colors flex-shrink-0 ml-2" title="Delete project">
            <Trash2 size={20} />
          </button>
        </div>
        <p className="text-indigo-600 font-semibold text-sm mb-2">{project.medical_school_name}</p>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{project.user_background.substring(0, 100)}...</p>
        <div className="text-xs text-gray-500 mb-4">Updated {new Date(project.updated_at).toLocaleDateString()}</div>
        <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold transition-colors w-full justify-center">
          View Project
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}
