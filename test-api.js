// Simple test file to verify API endpoints
// This file can be used for testing the enhanced TeamCollab APIs

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';
let authToken = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testTeam = {
  name: 'Test Team',
  description: 'A test team for development'
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
export const testAPIs = async () => {
  try {
    console.log('🚀 Starting TeamCollab API Tests...\n');
    
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
      
      // 4. Test Get Teams
      console.log('\n4. Testing Get Teams...');
      const getTeamsResponse = await makeAuthRequest('GET', '/team');
      console.log('✅ Get teams successful, found:', getTeamsResponse.data.teams.length, 'teams');
      
      // 5. Test User Search
      console.log('\n5. Testing User Search...');
      const searchResponse = await makeAuthRequest('GET', '/users/search?query=Test');
      console.log('✅ User search successful, found:', searchResponse.data.users.length, 'users');
      console.log('📊 Pagination info:', searchResponse.data.pagination);
      
      // 6. Test Team Search
      console.log('\n6. Testing Team Search...');
      try {
        const teamSearchResponse = await makeAuthRequest('GET', '/team/search?query=Test');
        console.log('✅ Team search successful, found:', teamSearchResponse.data.teams.length, 'teams');
        console.log('🔍 Search query:', teamSearchResponse.data.query);
      } catch (error) {
        console.log('ℹ️  Team search failed (expected if no teams match):', error.response?.data?.message || error.message);
      }
      
      // 7. Test Add Member (if we have another user)
      console.log('\n7. Testing Add Member...');
      try {
        const addMemberResponse = await makeAuthRequest('POST', `/team/${teamId}/members`, {
          userId: '507f1f77bcf86cd799439011' // Example ObjectId
        });
        console.log('✅ Add member successful:', addMemberResponse.data.message);
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
    
    console.log('\n🎉 All API tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
};

// Export for use in other files
export default testAPIs;
