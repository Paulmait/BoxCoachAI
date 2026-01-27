/**
 * RevenueCat Webhook Handler
 * Processes subscription events for revenue tracking and analytics
 *
 * RevenueCat webhook events:
 * - INITIAL_PURCHASE: New subscription
 * - RENEWAL: Subscription renewed
 * - CANCELLATION: Subscription cancelled
 * - UNCANCELLATION: Cancellation reversed
 * - EXPIRATION: Subscription expired
 * - BILLING_ISSUE: Payment failed
 * - PRODUCT_CHANGE: Plan changed
 * - SUBSCRIBER_ALIAS: User ID linked
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-revenuecat-webhook-auth-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RevenueCatEvent {
  event: {
    type: string;
    id: string;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    price: number;
    price_in_purchased_currency: number;
    currency: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number;
    store: string;
    environment: string;
    is_trial_conversion: boolean;
    cancel_reason?: string;
  };
  api_version: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify webhook authenticity (optional but recommended)
    const authKey = req.headers.get('x-revenuecat-webhook-auth-key');
    if (REVENUECAT_WEBHOOK_SECRET && authKey !== REVENUECAT_WEBHOOK_SECRET) {
      console.error('Invalid webhook auth key');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: RevenueCatEvent = await req.json();
    const event = payload.event;

    console.log(`Processing RevenueCat event: ${event.type} for user ${event.app_user_id}`);

    // Skip sandbox/test events in production tracking (but still log)
    const isProduction = event.environment === 'PRODUCTION';

    // Map RevenueCat event types to our event types
    let eventType: string;
    let revenueAmount = 0;

    switch (event.type) {
      case 'INITIAL_PURCHASE':
        eventType = 'purchase';
        revenueAmount = event.price_in_purchased_currency || event.price || 0;
        break;

      case 'RENEWAL':
        eventType = 'renewal';
        revenueAmount = event.price_in_purchased_currency || event.price || 0;
        break;

      case 'CANCELLATION':
        eventType = 'cancellation';
        break;

      case 'UNCANCELLATION':
        eventType = 'uncancellation';
        break;

      case 'EXPIRATION':
        eventType = 'expiration';
        break;

      case 'BILLING_ISSUE':
        eventType = 'billing_issue';
        break;

      case 'PRODUCT_CHANGE':
        eventType = 'product_change';
        revenueAmount = event.price_in_purchased_currency || event.price || 0;
        break;

      case 'SUBSCRIBER_ALIAS':
        // User ID linking - no revenue event needed
        console.log(`User alias linked: ${event.original_app_user_id} -> ${event.app_user_id}`);
        return new Response(JSON.stringify({ success: true, message: 'Alias processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(JSON.stringify({ success: true, message: 'Event type not tracked' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Find user by app_user_id (which should be their Supabase user ID)
    const userId = event.app_user_id;

    // Check if user exists in our database
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // Insert revenue event
    const { error: insertError } = await supabase.from('revenue_events').insert({
      user_id: profile?.id || null, // May be null if user ID doesn't match
      event_type: eventType,
      product_id: event.product_id,
      revenue_usd: revenueAmount,
      currency: event.currency || 'USD',
      transaction_id: event.id,
      platform: event.store?.toLowerCase() || 'unknown',
    });

    if (insertError) {
      console.error('Error inserting revenue event:', insertError);
      // Don't fail the webhook - RevenueCat will retry
    }

    // Update user preferences if this is a purchase/renewal
    if (profile?.id && (eventType === 'purchase' || eventType === 'renewal')) {
      // Track premium status in user_cohorts
      await supabase
        .from('user_cohorts')
        .update({ first_premium_date: new Date().toISOString().split('T')[0] })
        .eq('user_id', profile.id)
        .is('first_premium_date', null);

      // Track in analytics
      await supabase.from('analytics_events').insert({
        user_id: profile.id,
        event: 'subscription_' + eventType,
        properties: {
          product_id: event.product_id,
          price: revenueAmount,
          currency: event.currency,
          is_trial_conversion: event.is_trial_conversion,
          platform: event.store,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Handle cancellation - track in analytics
    if (profile?.id && eventType === 'cancellation') {
      await supabase.from('analytics_events').insert({
        user_id: profile.id,
        event: 'subscription_cancelled',
        properties: {
          product_id: event.product_id,
          cancel_reason: event.cancel_reason,
          platform: event.store,
        },
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Successfully processed ${eventType} event for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        event_type: eventType,
        user_id: profile?.id || null,
        revenue_tracked: revenueAmount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
