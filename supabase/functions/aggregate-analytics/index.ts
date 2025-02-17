import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WeekBounds {
  start: Date;
  end: Date;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with auth context
    const supabaseClient = createClient(
      // Get environment variables
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // Get all users
    const { data: users, error: userError } = await supabaseClient
      .from('auth.users')
      .select('id');

    if (userError) throw userError;

    // Get the date bounds for the last 5 weeks
    const today = new Date();
    const weeks: WeekBounds[] = [];
    
    // Generate week boundaries
    for (let i = 0; i < 5; i++) {
      const end = new Date(today);
      end.setDate(today.getDate() - (i * 7));
      end.setHours(23, 59, 59, 999);
      
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      
      weeks.push({ start, end });
    }

    // Process each user
    for (const user of users) {
      // Skip current week as we'll get that data real-time
      for (const week of weeks.slice(1)) {
        // Count created notes
        const { count: createdCount, error: createdError } = await supabaseClient
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', week.start.toISOString())
          .lt('created_at', week.end.toISOString());

        if (createdError) throw createdError;

        // Count completed notes
        const { count: completedCount, error: completedError } = await supabaseClient
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('completed_at', week.start.toISOString())
          .lt('completed_at', week.end.toISOString());

        if (completedError) throw completedError;

        // Upsert the aggregated data
        const { error: upsertError } = await supabaseClient
          .from('analytics_aggregates')
          .upsert({
            user_id: user.id,
            period_start: week.start.toISOString(),
            period_end: week.end.toISOString(),
            created_count: createdCount || 0,
            completed_count: completedCount || 0
          }, {
            onConflict: 'user_id,period_start,period_end'
          });

        if (upsertError) throw upsertError;
      }
    }

    return new Response(
      JSON.stringify({ message: 'Analytics aggregation completed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
}); 