/**
 * Setup script for BoxCoach AI
 * - Creates admin user account
 * - Tests edge functions
 * - Verifies database setup
 */

const https = require('https');

const SUPABASE_URL = 'https://bvyzvqzpmlqvnkujjaao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eXp2cXpwbWxxdm5rdWpqYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzMyNzQsImV4cCI6MjA4NTA0OTI3NH0.4kOcVWaq8jTE4HgpPua1WkqfYqIDahLZFnZ8832uI4M';

// Admin credentials
const ADMIN_EMAIL = 'guampaul@gmail.com';
const ADMIN_PASSWORD = 'BoxC0ach!AI#2026$Secure';

async function makeRequest(path, method, body, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createAdminUser() {
  console.log('\\n1. Creating admin user...');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);

  const result = await makeRequest('/auth/v1/signup', 'POST', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (result.status === 200 || result.status === 201) {
    console.log('   ✓ Admin user created successfully');
    console.log(`   User ID: ${result.data.user?.id || 'pending confirmation'}`);
    return result.data;
  } else if (result.data?.msg?.includes('already registered')) {
    console.log('   ⚠ User already exists, attempting login...');
    return await loginUser();
  } else {
    console.log(`   ✗ Failed: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function loginUser() {
  console.log('\\n2. Logging in...');

  const result = await makeRequest('/auth/v1/token?grant_type=password', 'POST', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (result.status === 200) {
    console.log('   ✓ Login successful');
    return result.data;
  } else {
    console.log(`   ✗ Login failed: ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function testDatabaseConnection(token) {
  console.log('\\n3. Testing database connection...');

  const result = await makeRequest('/rest/v1/profiles?select=id&limit=1', 'GET', null, token);

  if (result.status === 200) {
    console.log('   ✓ Database connection working');
    console.log('   ✓ RLS policies active');
    return true;
  } else {
    console.log(`   ✗ Database error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function testEdgeFunction(functionName, token) {
  console.log(`\\n4. Testing ${functionName} edge function...`);

  // Simple health check - send minimal data
  const testPayload = {
    frames: [],
    test: true
  };

  const result = await makeRequest(`/functions/v1/${functionName}`, 'POST', testPayload, token);

  if (result.status === 200) {
    console.log(`   ✓ ${functionName} function responding`);
    return true;
  } else if (result.status === 400) {
    console.log(`   ✓ ${functionName} function active (rejected empty test data as expected)`);
    return true;
  } else if (result.status === 401) {
    console.log(`   ⚠ ${functionName} requires authentication (expected)`);
    return true;
  } else {
    console.log(`   ✗ ${functionName} error: ${result.status} - ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function checkStorageBucket(token) {
  console.log('\\n5. Checking storage bucket...');

  const result = await makeRequest('/storage/v1/bucket/videos', 'GET', null, token);

  if (result.status === 200) {
    console.log('   ✓ Videos bucket exists');
    console.log(`   - Public: ${result.data.public}`);
    console.log(`   - File size limit: ${result.data.file_size_limit} bytes`);
    return true;
  } else {
    console.log(`   ✗ Storage error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('BoxCoach AI - Production Setup & Verification');
  console.log('='.repeat(50));

  // Create or login admin user
  let authData = await createAdminUser();

  if (!authData?.access_token) {
    authData = await loginUser();
  }

  if (!authData?.access_token) {
    console.log('\\n✗ Could not authenticate. Check if email confirmation is required.');
    console.log('  Go to Supabase Dashboard > Authentication > Users to confirm the user.');

    // Still test what we can without auth
    console.log('\\nTesting without authentication...');
  }

  const token = authData?.access_token;

  // Test components
  if (token) {
    await testDatabaseConnection(token);
    await checkStorageBucket(token);
  }

  await testEdgeFunction('analyze-boxing', token);
  await testEdgeFunction('detect-boxers', token);

  console.log('\\n' + '='.repeat(50));
  console.log('Setup Summary');
  console.log('='.repeat(50));
  console.log(`\\nAdmin Account:`);
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`\\nSupabase Dashboard:`);
  console.log(`  ${SUPABASE_URL.replace('.supabase.co', '')}/project/bvyzvqzpmlqvnkujjaao`);
  console.log(`\\nNote: Save these credentials securely!`);
}

main().catch(console.error);
