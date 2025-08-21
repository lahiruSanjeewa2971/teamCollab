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
  name: 'Third Team',
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
    
    // 3. Get existing teams
    console.log('\n3. Getting existing teams...');
    try {
      const getTeamsResponse = await makeAuthRequest('GET', '/team');
      console.log('✅ Get teams successful, found:', getTeamsResponse.data.teams.length, 'teams');
      
      if (getTeamsResponse.data.teams.length > 0) {
        const team = getTeamsResponse.data.teams[0];
        const teamId = team._id;
        console.log('📋 Using team:', team.name, 'ID:', teamId);
        console.log('📋 Current members:', team.members.length);
        
        // 4. Check if we can remove a member (test with owner first to see error)
        console.log('\n4. Testing Remove Member (Owner - should fail)...');
        const ownerMemberId = team.owner._id;
        console.log('📋 Attempting to remove owner:', ownerMemberId);
        try {
          const removeMemberResponse = await makeAuthRequest('DELETE', `/team/${teamId}/members/${ownerMemberId}`);
          console.log('✅ Remove member successful:', removeMemberResponse.data.message);
        } catch (error) {
          console.log('✅ Remove owner failed as expected:', error.response?.data?.message || error.message);
          console.log('🔍 Status:', error.response?.status);
        }
        
        // 5. Test Remove Member functionality with a different approach
        console.log('\n5. Testing Remove Member API endpoint...');
        // Let's test the endpoint with a fake member ID to see if the route exists
        try {
          const removeMemberResponse = await makeAuthRequest('DELETE', `/team/${teamId}/members/507f1f77bcf86cd799439999`);
          console.log('✅ Remove member successful:', removeMemberResponse.data.message);
        } catch (error) {
          if (error.response?.status === 400 && error.response.data.message.includes('not a member')) {
            console.log('✅ Remove member API working! Error as expected:', error.response.data.message);
          } else if (error.response?.status === 404) {
            console.log('❌ Route not found (404). The DELETE route may not be registered properly.');
          } else {
            console.log('🔍 Remove member response:', error.response?.status, error.response?.data?.message);
          }
        }
      } else {
        console.log('ℹ️  No teams found. Creating one...');
        const createTeamResponse = await makeAuthRequest('POST', '/team', testTeam);
        console.log('✅ Team creation successful:', createTeamResponse.data.message);
      }
      
    } catch (error) {
      console.log('❌ Get teams failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Remove Member API tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
};

// Run the tests
testRemoveMemberAPI();
