#!/usr/bin/env node

/**
 * Test script for user suspension functionality
 * Tests: pause, suspend, ban, and data access blocking
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bvyzvqzpmlqvnkujjaao.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eXp2cXpwbWxxdm5rdWpqYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDQ4NzgsImV4cCI6MjA2MzY4MDg3OH0.FUGAVoA9lm9cWxPVYdCQADwEPMdYdBcY9_PKN_WTu0Y';

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Set it with: $env:SUPABASE_SERVICE_KEY="your-service-key"');
  process.exit(1);
}

// Admin client with service role (bypasses RLS)
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// User client with anon key (respects RLS)
const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testResults = [];

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function recordResult(test, passed, details = '') {
  testResults.push({ test, passed, details });
  if (passed) {
    log(`  ✓ ${test}`, 'success');
  } else {
    log(`  ✗ ${test}: ${details}`, 'error');
  }
}

async function createTestUser() {
  const email = `suspension_test_${Date.now()}@gmail.com`;
  const password = 'TestPassword123!';

  log('\n📋 Creating test user...', 'info');

  // Create user via admin API
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    log(`Failed to create user: ${authError.message}`, 'error');
    return null;
  }

  // Create profile
  const { error: profileError } = await adminSupabase.from('profiles').insert({
    id: authData.user.id,
    email,
    role: 'user',
    stance: 'orthodox',
    experience_level: 'beginner',
    goals: [],
  });

  if (profileError) {
    log(`Failed to create profile: ${profileError.message}`, 'error');
    return null;
  }

  log(`Created test user: ${email}`, 'success');
  return { id: authData.user.id, email, password };
}

async function loginAsUser(email, password) {
  const { data, error } = await userSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data.session };
}

async function testSuspension(userId) {
  log('\n🔒 Testing SUSPEND functionality...', 'info');

  // 1. Suspend the user
  const suspendReason = 'Test suspension - violation of terms';
  const { error: suspendError } = await adminSupabase
    .from('profiles')
    .update({
      is_suspended: true,
      suspension_reason: suspendReason,
      suspended_at: new Date().toISOString(),
    })
    .eq('id', userId);

  recordResult('Suspend user via admin', !suspendError, suspendError?.message);

  // 2. Verify suspension in database
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_suspended, suspension_reason')
    .eq('id', userId)
    .single();

  recordResult(
    'Verify suspension in database',
    profile?.is_suspended === true && profile?.suspension_reason === suspendReason,
    `is_suspended: ${profile?.is_suspended}, reason: ${profile?.suspension_reason}`
  );

  // 3. Unsuspend user
  const { error: unsuspendError } = await adminSupabase
    .from('profiles')
    .update({
      is_suspended: false,
      suspension_reason: null,
      suspended_at: null,
    })
    .eq('id', userId);

  recordResult('Unsuspend user', !unsuspendError, unsuspendError?.message);
}

async function testPause(userId) {
  log('\n⏸️  Testing PAUSE functionality...', 'info');

  const pauseHours = 1;
  const pauseReason = `Temporarily paused for ${pauseHours} hours`;

  // 1. Pause the user
  const { error: pauseError } = await adminSupabase
    .from('profiles')
    .update({
      is_suspended: true,
      suspension_reason: pauseReason,
      suspended_at: new Date().toISOString(),
    })
    .eq('id', userId);

  recordResult('Pause user via admin', !pauseError, pauseError?.message);

  // 2. Verify pause in database
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_suspended, suspension_reason, suspended_at')
    .eq('id', userId)
    .single();

  const isPaused = profile?.is_suspended === true && profile?.suspension_reason?.includes('hours');
  recordResult('Verify pause in database', isPaused, `reason: ${profile?.suspension_reason}`);

  // 3. Calculate expected end time
  if (profile?.suspended_at) {
    const suspendedAt = new Date(profile.suspended_at);
    const pauseEndTime = new Date(suspendedAt.getTime() + pauseHours * 60 * 60 * 1000);
    log(`  Pause ends at: ${pauseEndTime.toISOString()}`, 'info');
  }

  // 4. Clean up - unsuspend
  await adminSupabase
    .from('profiles')
    .update({
      is_suspended: false,
      suspension_reason: null,
      suspended_at: null,
    })
    .eq('id', userId);
}

async function testDataAccessBlocking(testUser) {
  log('\n🛡️  Testing DATA ACCESS BLOCKING...', 'info');

  // Login as test user
  const loginResult = await loginAsUser(testUser.email, testUser.password);
  if (!loginResult.success) {
    recordResult('Login as test user', false, loginResult.error);
    return;
  }
  recordResult('Login as test user', true);

  // Try to insert an analysis record BEFORE suspension
  const { error: insertBeforeError } = await userSupabase.from('analyses').insert({
    user_id: testUser.id,
    video_url: 'test://video.mp4',
    status: 'pending',
  });

  // Note: This might fail if analyses table has different requirements
  const insertWorkedBefore = !insertBeforeError || insertBeforeError.message.includes('violates');
  log(`  Pre-suspension insert attempt: ${insertBeforeError?.message || 'Success'}`, 'info');

  // Now suspend the user
  await adminSupabase
    .from('profiles')
    .update({
      is_suspended: true,
      suspension_reason: 'Test suspension for RLS check',
      suspended_at: new Date().toISOString(),
    })
    .eq('id', testUser.id);

  log('  User suspended', 'info');

  // Try to read analyses (should fail or return empty due to RLS)
  const { data: analysesData, error: readError } = await userSupabase
    .from('analyses')
    .select('*')
    .eq('user_id', testUser.id);

  // With RLS, suspended user should either get error or empty results
  const readBlocked = readError || (analysesData && analysesData.length === 0);
  recordResult(
    'Read blocked for suspended user',
    readBlocked,
    readError?.message || `Got ${analysesData?.length || 0} records`
  );

  // Try to insert analysis (should fail due to RLS)
  const { error: insertAfterError } = await userSupabase.from('analyses').insert({
    user_id: testUser.id,
    video_url: 'test://suspended-video.mp4',
    status: 'pending',
  });

  recordResult(
    'Insert blocked for suspended user',
    !!insertAfterError,
    insertAfterError?.message || 'Insert succeeded (should have failed)'
  );

  // Check if user can still read their profile (should be allowed)
  const { data: profileData, error: profileError } = await userSupabase
    .from('profiles')
    .select('id, email, is_suspended, suspension_reason')
    .eq('id', testUser.id)
    .single();

  recordResult(
    'Suspended user can read own profile',
    !profileError && profileData?.is_suspended === true,
    profileError?.message || `Profile found: ${!!profileData}`
  );

  // Clean up - unsuspend
  await adminSupabase
    .from('profiles')
    .update({
      is_suspended: false,
      suspension_reason: null,
      suspended_at: null,
    })
    .eq('id', testUser.id);
}

async function testAdminAuditLogging(userId) {
  log('\n📝 Testing ADMIN AUDIT LOGGING...', 'info');

  // Get admin user (guampaul)
  const { data: adminProfile } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('email', 'guampaul@gmail.com')
    .single();

  if (!adminProfile) {
    recordResult('Find admin user', false, 'guampaul@gmail.com not found');
    return;
  }
  recordResult('Find admin user', true);

  // Insert audit log entry
  const { error: auditError } = await adminSupabase.from('admin_audit_log').insert({
    admin_id: adminProfile.id,
    action: 'suspend_user',
    target_user_id: userId,
    details: { test: true, reason: 'Test suspension' },
  });

  recordResult('Insert audit log entry', !auditError, auditError?.message);

  // Verify audit log
  const { data: auditLogs } = await adminSupabase
    .from('admin_audit_log')
    .select('*')
    .eq('target_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  recordResult(
    'Verify audit log exists',
    auditLogs && auditLogs.length > 0 && auditLogs[0].action === 'suspend_user',
    `Found ${auditLogs?.length || 0} logs`
  );
}

async function cleanupTestUser(userId) {
  log('\n🧹 Cleaning up test user...', 'info');

  // Delete audit logs
  await adminSupabase.from('admin_audit_log').delete().eq('target_user_id', userId);

  // Delete profile
  await adminSupabase.from('profiles').delete().eq('id', userId);

  // Delete auth user
  await adminSupabase.auth.admin.deleteUser(userId);

  log('Test user cleaned up', 'success');
}

async function printSummary() {
  log('\n' + '='.repeat(60), 'info');
  log('📊 TEST SUMMARY', 'info');
  log('='.repeat(60), 'info');

  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  const total = testResults.length;

  log(`\nTotal Tests: ${total}`, 'info');
  log(`Passed: ${passed}`, 'success');
  if (failed > 0) {
    log(`Failed: ${failed}`, 'error');
  }

  if (failed > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    testResults
      .filter((r) => !r.passed)
      .forEach((r) => {
        log(`  - ${r.test}: ${r.details}`, 'error');
      });
  }

  log('\n' + '='.repeat(60), 'info');
  return failed === 0;
}

async function main() {
  log('🧪 SUSPENSION FUNCTIONALITY TEST SUITE', 'info');
  log('='.repeat(60), 'info');

  let testUser = null;

  try {
    // Create test user
    testUser = await createTestUser();
    if (!testUser) {
      log('Failed to create test user, aborting tests', 'error');
      process.exit(1);
    }

    // Run tests
    await testSuspension(testUser.id);
    await testPause(testUser.id);
    await testDataAccessBlocking(testUser);
    await testAdminAuditLogging(testUser.id);

    // Print summary
    const allPassed = await printSummary();

    // Cleanup
    await cleanupTestUser(testUser.id);

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    log(`\nUnexpected error: ${error.message}`, 'error');
    console.error(error);

    // Try cleanup
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }

    process.exit(1);
  }
}

main();
