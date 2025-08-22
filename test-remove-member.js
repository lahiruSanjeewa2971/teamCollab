import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testUser = {
  name: 'Test User 3',
  email: 'test3@example.com',
  password: 'password123'
};

const testTeam = {
  name: 'Test Team 3',
  description: 'A test team for member removal testing'
};

// Helper function to make authenticated requests
const makeAuthRequest = (method, url, data = null) => {
  const config = {
    method,
    url: `${API_BASE_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
const testRemoveMemberAPI = async () => {
  try {
    console.log('🚀 Testing Remove Member API...\n');
    
    // 1. Test User Registration
    console.log('1. Testing User Registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      console.log('✅ User registration successful:', registerResponse.data.message);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️  User already exists, continuing...');
      } else {
        console.log('❌ User registration failed:', error.response?.data || error.message);
      }
    }
    
    // 2. Test User Login
    console.log('\n2. Testing User Login...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      authToken = loginResponse.data.accessToken;
      console.log('✅ User login successful, token received');
    } catch (error) {
      console.log('❌ User login failed:', error.response?.data || error.message);
      return;
    }
    
    // 3. Test Team Creation
    console.log('\n3. Testing Team Creation...');
    try {
      const createTeamResponse = await makeAuthRequest('POST', '/team', testTeam);
      console.log('✅ Team creation successful:', createTeamResponse.data.message);
      const teamId = createTeamResponse.data.team._id;
      console.log('📋 Team ID:', teamId);
      console.log('📋 Initial members:', createTeamResponse.data.team.members.length);
      
      // 4. Test Add Member (to have someone to remove)
      console.log('\n4. Testing Add Member...');
      try {
        // First, let's add a test user to the team
        const addMemberResponse = await makeAuthRequest('POST', `/team/${teamId}/members`, {
          userId: '507f1f77bcf86cd799439011' // Example ObjectId
        });
        console.log('✅ Add member successful:', addMemberResponse.data.message);
        console.log('📋 Members after adding:', addMemberResponse.data.team.members.length);
        
        // 5. Test Remove Member
        console.log('\n5. Testing Remove Member...');
        try {
          const removeMemberResponse = await makeAuthRequest('DELETE', `/team/${teamId}/members/507f1f77bcf86cd799439011`);
          console.log('✅ Remove member successful:', removeMemberResponse.data.message);
          console.log('📋 Members after removing:', removeMemberResponse.data.team.members.length);
        } catch (error) {
          console.log('❌ Remove member failed:', error.response?.data?.message || error.message);
        }
        
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('ℹ️  Add member failed (expected for invalid user ID):', error.response.data.message);
        } else {
          console.log('❌ Add member failed:', error.response?.data || error.message);
        }
      }
      
    } catch (error) {
      console.log('❌ Team creation failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Remove Member API tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
};

// Run the tests
testRemoveMemberAPI();
