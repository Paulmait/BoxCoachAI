import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const REVENUECAT_API_KEY = Deno.env.get('REVENUECAT_API_KEY') || '';

const FREE_DAILY_LIMIT = 3;
const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';
const PREMIUM_ENTITLEMENT = 'premium';

/**
 * Check if user has premium subscription via RevenueCat
 */
async function checkPremiumStatus(userId: string): Promise<boolean> {
  // If no RevenueCat API key configured, default to non-premium
  if (!REVENUECAT_API_KEY) {
    console.warn('RevenueCat API key not configured');
    return false;
  }

  try {
    const response = await fetch(
      `${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(userId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // User not found in RevenueCat = no subscription
      if (response.status === 404) {
        return false;
      }
      console.error('RevenueCat API error:', response.status);
      return false;
    }

    const data = await response.json();
    const entitlements = data.subscriber?.entitlements || {};

    // Check if user has active premium entitlement
    const premiumEntitlement = entitlements[PREMIUM_ENTITLEMENT];
    if (premiumEntitlement) {
      const expiresDate = new Date(premiumEntitlement.expires_date);
      return expiresDate > new Date();
    }

    return false;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
}

const BOXING_ANALYSIS_PROMPT = `You are an expert boxing coach analyzing video frames of a boxer's technique. Analyze the frames provided and give detailed, constructive feedback.

For each analysis, evaluate the following categories on a scale of 1-100:
- Stance: foot position, weight distribution, balance
- Guard: hand position, elbow placement, chin protection
- Footwork: movement quality, balance during motion
- Jab: extension, speed, return, protection
- Cross: hip rotation, power transfer, follow-through
- Hook: elbow angle, body rotation, power generation
- Uppercut: vertical trajectory, body mechanics
- Defense: head movement, blocking technique
- Head Movement: slipping, bobbing, weaving
- Combinations: flow, timing, punch selection

Identify 2-3 root causes of any technique issues:
- stance_width, weight_distribution, guard_position, elbow_flare
- hip_rotation, shoulder_turn, footwork_timing, balance_issues
- telegraphing, recovery_position, breathing, chin_exposure

Format your response as JSON with this structure:
{
  "overallScore": 0-100,
  "stance": "orthodox" or "southpaw",
  "techniqueScores": [
    {
      "category": "stance|guard|footwork|jab|cross|hook|uppercut|defense|head_movement|combinations",
      "score": 0-100,
      "feedback": "specific feedback",
      "strengths": ["strength 1", "strength 2"],
      "improvements": ["improvement 1", "improvement 2"]
    }
  ],
  "rootCauses": [
    {
      "cause": "root_cause_id",
      "severity": "low|medium|high",
      "description": "what is happening",
      "impact": "how it affects performance",
      "recommendedDrills": ["drill_id_1", "drill_id_2"]
    }
  ],
  "summary": "2-3 sentence overall assessment",
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "priorityImprovements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommendedDrills": ["drill_id_1", "drill_id_2", "drill_id_3", "drill_id_4"]
}

Available drill IDs: stance_check, guard_position, jab_drill, cross_power, hook_technique, uppercut_drill, slip_drill, roll_practice, parry_timing, ladder_drill, pivot_practice, angle_work, rope_skipping, shadow_boxing, jab_cross, double_jab, three_punch_combo

Be encouraging but honest. Focus on actionable improvements.`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://boxcoach.ai',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check subscription status via RevenueCat
    const isPremium = await checkPremiumStatus(user.id);

    // Check rate limit (skip for premium users)
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('analyses_count')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (!isPremium && rateLimit && rateLimit.analyses_count >= FREE_DAILY_LIMIT) {
      return new Response(JSON.stringify({
        error: 'Daily limit reached',
        limit: FREE_DAILY_LIMIT,
        isPremium: false,
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { frames, boxerSelection, userStance, experienceLevel } = await req.json();

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return new Response(JSON.stringify({ error: 'No frames provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare image content for Claude
    const imageContent = frames.map((frameBase64: string, index: number) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: frameBase64,
      },
    }));

    // Build prompt with context
    let contextPrompt = BOXING_ANALYSIS_PROMPT;
    if (userStance) {
      contextPrompt += `\n\nThe boxer reports their stance as: ${userStance}`;
    }
    if (experienceLevel) {
      contextPrompt += `\nExperience level: ${experienceLevel}`;
    }
    if (boxerSelection) {
      contextPrompt += `\nFocus on the boxer in the highlighted region of the frames.`;
    }

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              ...imageContent,
              {
                type: 'text',
                text: contextPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeResponse.json();
    const analysisText = claudeData.content[0]?.text || '';

    // Parse JSON from Claude's response
    let analysis;
    try {
      // Extract JSON from the response (Claude might wrap it in markdown code blocks)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse analysis' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Increment rate limit
    await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_limit: 999, // Just increment, we already checked
    });

    return new Response(JSON.stringify({ success: true, analysis }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://boxcoach.ai',
      },
    });
  } catch (error) {
    console.error('Error in analyze-boxing function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
