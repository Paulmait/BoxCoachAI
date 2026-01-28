/**
 * Create videos storage bucket via Supabase API
 * Run: node scripts/create-storage-bucket.js
 */

const https = require('https');

// Configuration - Load from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.log('ERROR: SUPABASE_URL environment variable required');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.log('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable required');
  console.log('');
  console.log('To create the bucket manually, go to Supabase Dashboard:');
  console.log('1. Go to your project Storage > Buckets');
  console.log('2. Click "New bucket"');
  console.log('3. Name: videos');
  console.log('4. Public bucket: OFF (unchecked)');
  console.log('5. File size limit: 104857600 (100MB)');
  console.log('6. Allowed MIME types: video/mp4, video/quicktime, video/x-m4v, image/jpeg, image/png');
  console.log('');
  console.log('Then add storage policies in SQL Editor.');
  process.exit(1);
}

async function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
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

async function createBucket() {
  console.log('Creating videos storage bucket...');

  const result = await makeRequest('/storage/v1/bucket', 'POST', {
    id: 'videos',
    name: 'videos',
    public: false,
    file_size_limit: 104857600,
    allowed_mime_types: ['video/mp4', 'video/quicktime', 'video/x-m4v', 'image/jpeg', 'image/png'],
  });

  if (result.status === 200 || result.status === 201) {
    console.log('✓ Videos bucket created successfully');
  } else if (result.data?.error === 'Duplicate') {
    console.log('✓ Videos bucket already exists');
  } else {
    console.log('✗ Failed: ' + JSON.stringify(result.data));
  }
}

createBucket().catch(console.error);
