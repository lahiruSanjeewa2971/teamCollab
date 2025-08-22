import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpass123'
};

let authToken = null;
let userId = null;

async function testSocketNotification() {
  try {
    console.log('🧪 Testing Socket.IO Notification System...\n');

    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testUser);
    authToken = loginResponse.data.accessToken;
    userId = loginResponse.data.user._id;
    console.log('✅ Login successful, User ID:', userId);

    // Step 2: Check socket status
    console.log('\n2️⃣ Checking Socket.IO status...');
    const socketStatus = await axios.get('http://localhost:5000/socket-status');
    console.log('📊 Socket Status:', socketStatus.data);

    // Step 3: Test team removal notification (simulate)
    console.log('\n3️⃣ Testing team removal notification...');
    console.log('📢 This would trigger a notification to user:', userId);
    console.log('📱 Check the frontend to see if notification appears');

    // Step 4: Check socket status again
    console.log('\n4️⃣ Checking Socket.IO status after test...');
    const socketStatusAfter = await axios.get('http://localhost:5000/socket-status');
    console.log('📊 Socket Status After:', socketStatusAfter.data);

    console.log('\n✅ Test completed! Check frontend for notifications.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testSocketNotification();
