'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Wand2, Loader } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;
  
  const [project, setProject] = useState(null);
  const [profile, setProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [generatingForQuestion, setGeneratingForQuestion] = useState(null);

  useEffect(() => {
    fetchProjectAndRelated();
  }, [projectId]);

  const fetchProjectAndRelated = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch profile if exists
      if (projectData.profile_id) {
        const { data: profileData } = await supabase
          .from('applicant_profiles')
          .select('*')
          .eq('id', projectData.profile_id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('secondary_questions')
        .select('*')
        .eq('project_id', projectId)
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      const supabase = createBrowserClient();
      const questionNumber = questions.length + 1;

      const { data, error } = await supabase
        .from('secondary_questions')
        .insert([
          {
            project_id: projectId,
            question_number: questionNumber,
            question_text: newQuestion
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setQuestions([...questions, data]);
      setNewQuestion('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('secondary_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      setError(err.message);
    }
  };

  const generateRecommendation = async (question) => {
    if (!project || generatingForQuestion === question.id) return;

    setGeneratingForQuestion(question.id);
    try {
      const userBackground = profile ? 
        `CLINICAL: ${profile.clinical_experience}\nRESEARCH: ${profile.research_experience}\nLEADERSHIP: ${profile.leadership_volunteer}\nGOALS: ${profile.career_goals}\nVALUES: ${profile.personal_values}\nSTORY: ${profile.unique_story}\nSKILLS: ${profile.skills_accomplishments}`
        : '';

      const schoolContext = project.school_specific_notes ? `\nSCHOOL-SPECIFIC NOTES: ${project.school_specific_notes}` : '';

      const response = await fetch('/api/generate-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBackground: userBackground + schoolContext,
          medicalSchoolName: project.medical_school_name,
          question: question.question_text,
          questionNumber: question.question_number,
          questionId: question.id
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('secondary_questions')
        .update({ recommended_approach: data.recommendation })
        .eq('id', question.id);

      if (error) throw error;

      setQuestions(questions.map(q => 
        q.id === question.id ? { ...q, recommended_approach: data.recommendation } : q
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingForQuestion(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Project not found</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">Back to Projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
        <ArrowLeft size={20} />
        Back to Projects
      </Link>

      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
        <p className="text-gray-600 mt-2">{project.medical_school_name}</p>
        {project.school_specific_notes && (
          <p className="text-blue-700 mt-3 bg-blue-50 p-3 rounded">
            <span className="font-semibold">School Notes:</span> {project.school_specific_notes}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-4">
          Created {new Date(project.created_at).toLocaleDateString()}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError('')}
            className="text-sm text-red-600 hover:text-red-700 mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Secondary Questions</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
            placeholder="Paste a secondary essay question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={handleAddQuestion}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No questions added yet. Add your first secondary question above!</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 p-6 border-b">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {question.question_number}
                  </h3>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-700 transition-colors p-1"
                    title="Delete question"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <p className="text-gray-700">{question.question_text}</p>
              </div>

              <div className="p-6">
                {question.recommended_approach ? (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">📋 Recommended Approach:</h4>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-gray-700">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {question.recommended_approach}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => generateRecommendation(question)}
                    disabled={generatingForQuestion === question.id}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {generatingForQuestion === question.id ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Generating Recommendation...
                      </>
                    ) : (
                      <>
                        <Wand2 size={20} />
                        Generate AI Recommendation
                      </>
                    )}
                  </button>
                )}

                {question.recommended_approach && (
                  <div className="mt-4">
                    <button
                      onClick={() => generateRecommendation(question)}
                      disabled={generatingForQuestion === question.id}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1"
                    >
                      <Wand2 size={16} />
                      Regenerate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">💡 Next Steps</h3>
        <p className="text-blue-800 text-sm">
          Use the generated recommendations above to craft your responses. Each recommendation is personalized to your profile and this school's specific context.
        </p>
      </div>
    </div>
  );
}
