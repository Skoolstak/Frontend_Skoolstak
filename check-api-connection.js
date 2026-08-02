// Quick frontend-backend connectivity test
const API_BASE_URL = 'http://localhost:5000/api';

console.log('🔍 Testing Frontend-Backend Connection...\n');
console.log('API Base URL:', API_BASE_URL);

// Test with a non-existent route - should get 404 from backend (proves it's running)
fetch(`${API_BASE_URL}/ping-test`)
  .then(res => res.json())
  .then(data => {
    // If we get a 404 JSON response, backend is running
    if (data.error && data.error.includes('not found')) {
      console.log('✅ Backend server is running and reachable');
      console.log('   API Base URL:', API_BASE_URL);
      process.exit(0);
    } else {
      console.log('✅ Backend server is running');
      console.log('   Response:', data);
      process.exit(0);
    }
  })
  .catch(err => {
    console.log('❌ Backend server not reachable');
    console.log('   Error:', err.message);
    console.log('\n⚠️  Make sure backend server is running:');
    console.log('   cd server');
    console.log('   npm start');
    process.exit(1);
  });
