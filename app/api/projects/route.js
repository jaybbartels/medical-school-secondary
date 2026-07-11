import { createServerClient } from '@/lib/supabase';

export async function GET(request) {
  try {
    const supabase = createServerClient();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createServerClient();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, medical_school_name, user_background } = body;

    if (!title || !medical_school_name || !user_background) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          user_id: user.id,
          title,
          medical_school_name,
          user_background
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error creating project:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
