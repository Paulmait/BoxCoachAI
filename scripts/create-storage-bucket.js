/**
 * Create storage bucket via Supabase Storage API
 */

const https = require('https');

const SUPABASE_URL = 'https://bvyzvqzpmlqvnkujjaao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eXp2cXpwbWxxdm5rdWpqYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzMyNzQsImV4cCI6MjA4NTA0OTI3NH0.4kOcVWaq8jTE4HgpPua1WkqfYqIDahLZFnZ8832uI4M';

// First login to get access token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'guampaul@gmail.com',
      password: 'BoxC0ach!AI#2026$Secure'
    });

    const options = {
      hostname: 'bvyzvqzpmlqvnkujjaao.supabase.co',
      path: '/auth/v1/token?grant_type=password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(responseData);
        resolve(parsed.access_token);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function createBucket(token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      id: 'videos',
      name: 'videos',
      public: false
    });

    const options = {
      hostname: 'bvyzvqzpmlqvnkujjaao.supabase.co',
      path: '/storage/v1/bucket',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${responseData}`);
        resolve(res.statusCode);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Getting access token...');
  const token = await getAccessToken();

  if (!token) {
    console.log('Failed to get token');
    return;
  }

  console.log('Creating videos bucket...');
  await createBucket(token);
}

main().catch(console.error);
