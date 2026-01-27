import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ALLOWED_ORIGIN = 'https://boxcoach.ai';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role (can delete data)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Parse request body for confirmation
    const { confirmDelete } = await req.json();

    if (confirmDelete !== true) {
      return new Response(JSON.stringify({ error: 'Deletion must be confirmed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Start deletion process
    const deletionResults: Record<string, { deleted: number; error?: string }> = {};

    // 1. Delete user videos from storage
    try {
      const { data: files } = await supabase.storage
        .from('videos')
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${userId}/${f.name}`);
        await supabase.storage.from('videos').remove(filePaths);
        deletionResults.videos = { deleted: files.length };
      } else {
        deletionResults.videos = { deleted: 0 };
      }
    } catch (error) {
      deletionResults.videos = { deleted: 0, error: 'Failed to delete videos' };
    }

    // 2. Delete analyses
    const { data: analysesData, error: analysesError } = await supabase
      .from('analyses')
      .delete()
      .eq('user_id', userId)
      .select('id');

    deletionResults.analyses = {
      deleted: analysesData?.length || 0,
      error: analysesError?.message,
    };

    // 3. Delete drill completions
    const { data: drillsData, error: drillsError } = await supabase
      .from('drill_completions')
      .delete()
      .eq('user_id', userId)
      .select('id');

    deletionResults.drill_completions = {
      deleted: drillsData?.length || 0,
      error: drillsError?.message,
    };

    // 4. Delete analytics events
    const { data: eventsData, error: eventsError } = await supabase
      .from('analytics_events')
      .delete()
      .eq('user_id', userId)
      .select('id');

    deletionResults.analytics_events = {
      deleted: eventsData?.length || 0,
      error: eventsError?.message,
    };

    // 5. Delete user preferences
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    deletionResults.user_preferences = {
      deleted: prefsError ? 0 : 1,
      error: prefsError?.message,
    };

    // 6. Delete rate limits
    const { error: rateLimitError } = await supabase
      .from('rate_limits')
      .delete()
      .eq('user_id', userId);

    deletionResults.rate_limits = {
      deleted: rateLimitError ? 0 : 1,
      error: rateLimitError?.message,
    };

    // 7. Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    deletionResults.profiles = {
      deleted: profileError ? 0 : 1,
      error: profileError?.message,
    };

    // 8. Delete auth user (this should be last)
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete user account',
        partial_deletion: deletionResults,
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'All user data has been permanently deleted',
      deletion_summary: deletionResults,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      },
    });
  } catch (error) {
    console.error('Error in delete-user-data function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      },
    });
  }
});
