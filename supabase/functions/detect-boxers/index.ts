import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const DETECTION_PROMPT = `Analyze this image and identify all people visible in the frame. For each person detected, provide their bounding box coordinates as percentages of the image dimensions.

Return a JSON object with this exact structure:
{
  "people": [
    {
      "id": "person_1",
      "boundingBox": {
        "x": 0-100,
        "y": 0-100,
        "width": 0-100,
        "height": 0-100
      },
      "confidence": 0.0-1.0,
      "label": "left|center|right|far_left|far_right"
    }
  ]
}

The boundingBox coordinates represent:
- x: left edge position as percentage of image width
- y: top edge position as percentage of image height
- width: box width as percentage of image width
- height: box height as percentage of image height

The label should indicate the person's position in the frame (left, center, right, etc.).

If no people are detected, return: {"people": []}

Be accurate with bounding boxes - they should tightly fit around each person's full body.`;

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

    // Parse request body
    const { frameBase64 } = await req.json();

    if (!frameBase64) {
      return new Response(JSON.stringify({ error: 'No frame provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Claude API for detection
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: frameBase64,
                },
              },
              {
                type: 'text',
                text: DETECTION_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      return new Response(JSON.stringify({ error: 'Detection failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeResponse.json();
    const detectionText = claudeData.content[0]?.text || '';

    // Parse JSON from Claude's response
    let detection;
    try {
      const jsonMatch = detectionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        detection = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      // Return empty people array if parsing fails
      detection = { people: [] };
    }

    return new Response(JSON.stringify({ success: true, ...detection }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://boxcoach.ai',
      },
    });
  } catch (error) {
    console.error('Error in detect-boxers function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
