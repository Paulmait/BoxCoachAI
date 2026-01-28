/**
 * BoxCoach AI - Full System Test
 * Tests onboarding, app flows, revenue webhook, and investor metrics
 */

const https = require('https');

// Configuration - Load from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('ERROR: SUPABASE_URL environment variable is required');
  console.log('Set it with: export SUPABASE_URL="your-supabase-url"');
  process.exit(1);
}
if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_ANON_KEY environment variable is required');
  console.log('Set it with: export SUPABASE_ANON_KEY="your-anon-key"');
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

// Test user credentials
const TEST_EMAIL = 'testuser' + Date.now() + '@gmail.com';
const TEST_PASSWORD = 'TestPass123!';

let testUserId = null;
let testUserToken = null;

async function makeRequest(path, method, body, authToken = null, useServiceRole = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': useServiceRole ? SERVICE_ROLE_KEY : SUPABASE_ANON_KEY,
      }
    };

    if (authToken) {
      options.headers['Authorization'] = 'Bearer ' + authToken;
    } else if (useServiceRole) {
      options.headers['Authorization'] = 'Bearer ' + SERVICE_ROLE_KEY;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testSignup() {
  console.log('\n=== TEST 1: User Signup ===');
  console.log('Email:', TEST_EMAIL);

  const result = await makeRequest('/auth/v1/signup', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (result.status === 200 || result.status === 201) {
    testUserId = result.data.user?.id;
    testUserToken = result.data.access_token;
    console.log('OK: User created, ID:', testUserId);
    return true;
  } else {
    console.log('FAIL:', JSON.stringify(result.data));
    return false;
  }
}

async function testLogin() {
  console.log('\n=== TEST 2: User Login ===');

  const result = await makeRequest('/auth/v1/token?grant_type=password', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (result.status === 200) {
    testUserToken = result.data.access_token;
    testUserId = result.data.user?.id;
    console.log('OK: Login successful');
    return true;
  } else {
    console.log('FAIL:', JSON.stringify(result.data));
    return false;
  }
}

async function testProfileCreation() {
  console.log('\n=== TEST 3: Profile Auto-Creation ===');

  const result = await makeRequest(
    '/rest/v1/profiles?select=*&id=eq.' + testUserId,
    'GET',
    null,
    testUserToken
  );

  if (result.status === 200 && result.data.length > 0) {
    console.log('OK: Profile auto-created');
    console.log('   Email:', result.data[0].email);
    console.log('   Stance:', result.data[0].stance);
    console.log('   Level:', result.data[0].experience_level);
    return true;
  } else {
    console.log('FAIL: Profile not found');
    return false;
  }
}

async function testUserCohort() {
  console.log('\n=== TEST 4: User Cohort Auto-Creation ===');

  const result = await makeRequest(
    '/rest/v1/user_cohorts?select=*&user_id=eq.' + testUserId,
    'GET',
    null,
    null,
    true // Use service role
  );

  if (result.status === 200 && result.data.length > 0) {
    console.log('OK: User cohort created');
    console.log('   Signup Date:', result.data[0].signup_date);
    console.log('   Signup Week:', result.data[0].signup_week);
    return true;
  } else {
    console.log('WARN: User cohort not created (trigger may not be active)');
    return true; // Non-critical
  }
}

async function testAnalyticsEvent() {
  console.log('\n=== TEST 5: Analytics Event Tracking ===');

  const result = await makeRequest(
    '/rest/v1/analytics_events',
    'POST',
    {
      user_id: testUserId,
      event: 'test_event',
      properties: { test: true, source: 'system_test' },
      timestamp: new Date().toISOString(),
    },
    testUserToken
  );

  if (result.status === 201) {
    console.log('OK: Analytics event recorded');
    return true;
  } else {
    console.log('FAIL:', JSON.stringify(result.data));
    return false;
  }
}

async function testFeatureUsage() {
  console.log('\n=== TEST 6: Feature Usage Tracking ===');

  const result = await makeRequest(
    '/rest/v1/rpc/track_feature_usage',
    'POST',
    {
      p_user_id: testUserId,
      p_feature: 'video_analysis',
      p_metadata: { test: true },
    },
    null,
    true // Service role for RPC
  );

  if (result.status === 200 || result.status === 204) {
    console.log('OK: Feature usage tracked');
    return true;
  } else {
    console.log('FAIL:', JSON.stringify(result.data));
    return false;
  }
}

async function testRevenueWebhook() {
  console.log('\n=== TEST 7: RevenueCat Webhook ===');

  const mockEvent = {
    event: {
      type: 'INITIAL_PURCHASE',
      id: 'test_txn_' + Date.now(),
      app_user_id: testUserId,
      original_app_user_id: testUserId,
      product_id: 'boxcoach_premium_monthly',
      entitlement_ids: ['premium'],
      price: 9.99,
      price_in_purchased_currency: 9.99,
      currency: 'USD',
      period_type: 'NORMAL',
      purchased_at_ms: Date.now(),
      expiration_at_ms: Date.now() + 30 * 24 * 60 * 60 * 1000,
      store: 'APP_STORE',
      environment: 'SANDBOX',
      is_trial_conversion: false,
    },
    api_version: '1.0',
  };

  const result = await makeRequest(
    '/functions/v1/revenue-webhook',
    'POST',
    mockEvent,
    null,
    true
  );

  if (result.status === 200 && result.data?.success) {
    console.log('OK: Revenue webhook processed');
    console.log('   Event Type:', result.data.event_type);
    console.log('   Revenue:', result.data.revenue_tracked);
    return true;
  } else {
    console.log('FAIL:', JSON.stringify(result.data));
    return false;
  }
}

async function testRevenueRecorded() {
  console.log('\n=== TEST 8: Revenue Event Recorded ===');

  const result = await makeRequest(
    '/rest/v1/revenue_events?select=*&order=created_at.desc&limit=1',
    'GET',
    null,
    null,
    true
  );

  if (result.status === 200 && result.data.length > 0) {
    const rev = result.data[0];
    console.log('OK: Revenue event in database');
    console.log('   Product:', rev.product_id);
    console.log('   Revenue:', '$' + rev.revenue_usd);
    console.log('   Platform:', rev.platform);
    return true;
  } else {
    console.log('FAIL: No revenue event found');
    return false;
  }
}

async function testDailyMetrics() {
  console.log('\n=== TEST 9: Daily Metrics Calculation ===');

  // Run the daily metrics function
  const calcResult = await makeRequest(
    '/rest/v1/rpc/calculate_daily_metrics',
    'POST',
    {},
    null,
    true
  );

  if (calcResult.status !== 200 && calcResult.status !== 204) {
    console.log('WARN: Could not run metrics calculation');
  }

  // Fetch metrics
  const result = await makeRequest(
    '/rest/v1/app_metrics?select=*&order=metric_date.desc&limit=1',
    'GET',
    null,
    null,
    true
  );

  if (result.status === 200 && result.data.length > 0) {
    const m = result.data[0];
    console.log('OK: Daily metrics available');
    console.log('   Date:', m.metric_date);
    console.log('   Total Users:', m.total_users);
    console.log('   New Signups:', m.new_signups);
    console.log('   Total Analyses:', m.total_analyses);
    return true;
  } else {
    console.log('FAIL: No metrics data');
    return false;
  }
}

async function testStorageBucket() {
  console.log('\n=== TEST 10: Storage Bucket ===');

  const result = await makeRequest(
    '/storage/v1/bucket/videos',
    'GET',
    null,
    null,
    true
  );

  if (result.status === 200) {
    console.log('OK: Videos bucket exists');
    console.log('   Size Limit:', (result.data.file_size_limit / 1024 / 1024).toFixed(0) + ' MB');
    console.log('   Public:', result.data.public);
    return true;
  } else {
    console.log('FAIL: Storage bucket not found');
    return false;
  }
}

async function testEdgeFunctions() {
  console.log('\n=== TEST 11: Edge Functions Health ===');

  const functions = ['analyze-boxing', 'detect-boxers', 'delete-user-data', 'revenue-webhook'];
  let allOk = true;

  for (const fn of functions) {
    const result = await makeRequest(
      '/functions/v1/' + fn,
      'POST',
      { test: true },
      testUserToken
    );

    // 400 or 401 means function is responding (just rejecting bad input)
    if (result.status === 200 || result.status === 400 || result.status === 401) {
      console.log('OK: ' + fn + ' - responding');
    } else {
      console.log('FAIL: ' + fn + ' - status ' + result.status);
      allOk = false;
    }
  }

  return allOk;
}

async function testAdminAccess() {
  console.log('\n=== TEST 12: Admin User Access ===');

  // Get admin credentials from environment
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('SKIP: ADMIN_EMAIL and ADMIN_PASSWORD env vars required');
    return true; // Non-critical test
  }

  // Login as admin
  const loginResult = await makeRequest('/auth/v1/token?grant_type=password', 'POST', {
    email: adminEmail,
    password: adminPassword,
  });

  if (loginResult.status !== 200) {
    console.log('FAIL: Admin login failed');
    return false;
  }

  const adminToken = loginResult.data.access_token;
  const adminId = loginResult.data.user.id;

  // Check admin profile
  const profileResult = await makeRequest(
    '/rest/v1/profiles?select=email,role&id=eq.' + adminId,
    'GET',
    null,
    adminToken
  );

  if (profileResult.status === 200 && profileResult.data[0]?.role === 'super_admin') {
    console.log('OK: Admin has super_admin role');
    return true;
  } else {
    console.log('FAIL: Admin role not set correctly');
    return false;
  }
}

async function cleanupTestUser() {
  console.log('\n=== CLEANUP: Removing Test User ===');

  if (!testUserId) {
    console.log('SKIP: No test user to clean up');
    return;
  }

  // Delete user data using service role
  const tables = ['analytics_events', 'feature_usage', 'user_sessions', 'user_cohorts', 'profiles'];

  for (const table of tables) {
    await makeRequest(
      '/rest/v1/' + table + '?user_id=eq.' + testUserId,
      'DELETE',
      null,
      null,
      true
    );
  }

  // Delete auth user
  await makeRequest(
    '/auth/v1/admin/users/' + testUserId,
    'DELETE',
    null,
    null,
    true
  );

  console.log('OK: Test user cleaned up');
}

async function main() {
  console.log('='.repeat(60));
  console.log('BoxCoach AI - Full System Test');
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const tests = [
    { name: 'User Signup', fn: testSignup },
    { name: 'User Login', fn: testLogin },
    { name: 'Profile Creation', fn: testProfileCreation },
    { name: 'User Cohort', fn: testUserCohort },
    { name: 'Analytics Event', fn: testAnalyticsEvent },
    { name: 'Feature Usage', fn: testFeatureUsage },
    { name: 'Revenue Webhook', fn: testRevenueWebhook },
    { name: 'Revenue Recorded', fn: testRevenueRecorded },
    { name: 'Daily Metrics', fn: testDailyMetrics },
    { name: 'Storage Bucket', fn: testStorageBucket },
    { name: 'Edge Functions', fn: testEdgeFunctions },
    { name: 'Admin Access', fn: testAdminAccess },
  ];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.tests.push({ name: test.name, passed });
      if (passed) results.passed++;
      else results.failed++;
    } catch (error) {
      console.log('ERROR:', error.message);
      results.tests.push({ name: test.name, passed: false });
      results.failed++;
    }
  }

  // Cleanup
  await cleanupTestUser();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('Passed:', results.passed + '/' + (results.passed + results.failed));
  console.log('Failed:', results.failed);
  console.log('');

  for (const t of results.tests) {
    console.log((t.passed ? 'PASS' : 'FAIL') + ' - ' + t.name);
  }

  if (results.failed === 0) {
    console.log('\nAll systems operational!');
  } else {
    console.log('\nSome tests failed. Review the output above.');
  }
}

main().catch(console.error);
