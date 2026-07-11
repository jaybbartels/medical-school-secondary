import { createServerClient } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return Response.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('secondary_questions')
      .select('*')
      .eq('project_id', projectId)
      .order('question_number', { ascending: true });

    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { projectId, question_number, question_text } = body;

    if (!projectId || !question_number || !question_text) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('secondary_questions')
      .insert([
        {
          project_id: projectId,
          question_number,
          question_text
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error creating question:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { questionId, recommended_approach, user_answer } = body;

    if (!questionId) {
      return Response.json(
        { error: 'Missing questionId' },
        { status: 400 }
      );
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (recommended_approach !== undefined) updateData.recommended_approach = recommended_approach;
    if (user_answer !== undefined) updateData.user_answer = user_answer;

    const { data, error } = await supabase
      .from('secondary_questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error updating question:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return Response.json(
        { error: 'Missing questionId parameter' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('secondary_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
