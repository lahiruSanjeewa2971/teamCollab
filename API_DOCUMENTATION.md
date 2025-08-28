# TeamCollab Backend API Documentation

## Overview
This document describes the enhanced TeamCollab backend APIs built with Node.js, Express, and MongoDB following the controller → service → repository pattern.

## Base URL
```
http://localhost:5001/api
```

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Authentication APIs

#### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": null,
    "role": "user"
  }
}
```

### 2. Team Management APIs

#### POST /api/team
Create a new team (requires authentication).

**Request Body:**
```json
{
  "name": "Marketing Team",
  "description": "Team responsible for marketing campaigns",
  "members": ["507f1f77bcf86cd799439012"]
}
```

**Response:**
```json
{
  "message": "New team created successfully",
  "team": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Marketing Team",
    "description": "Team responsible for marketing campaigns",
    "owner": "507f1f77bcf86cd799439011",
    "members": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

#### GET /api/team
Get all teams where the authenticated user is a member.

**Response:**
```json
{
  "teams": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Marketing Team",
      "description": "Team responsible for marketing campaigns",
      "owner": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        }
      ],
      "isOwner": true,
      "createdAt": "2025-01-20T10:30:00.000Z",
      "updatedAt": "2025-01-20T10:30:00.000Z"
    }
  ]
}
```

#### GET /api/team/search?query=teamName
Search for teams by name. Returns teams that match the search query and where the user is not already a member.

**Query Parameters:**
- `query` (required): Search term for team name (case-insensitive, partial match)

**Response:**
```json
{
  "teams": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Marketing Team",
      "description": "Team responsible for marketing campaigns",
      "owner": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [
        {
          "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
        }
      ],
      "isOwner": false,
      "isMember": false,
      "createdAt": "2025-01-20T10:30:00.000Z",
      "updatedAt": "2025-01-20T10:30:00.000Z"
    }
  ],
  "query": "marketing"
}
```

#### POST /api/team/:teamId/join
Join an existing team (requires authentication).

**Response:**
```json
{
  "message": "Team join successful",
  "updatedTeam": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Marketing Team",
    "members": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

#### POST /api/team/:teamId/members
Add a new member to a team (only team owner can do this).

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "message": "Member added successfully",
  "team": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Marketing Team",
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    ]
  }
}
```

**Error Response (403 - Not Owner):**
```json
{
  "status": "fail",
  "message": "Only team owner can add members"
}
```

#### DELETE /api/team/:teamId/members/:memberId
Remove a member from a team (only team owner can do this).

**Response:**
```json
{
  "message": "Member removed successfully.",
  "team": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Marketing Team",
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ]
  }
}
```

**Error Response (403 - Not Owner):**
```json
{
  "status": "fail",
  "message": "Only team owner can remove members"
}
```

**Error Response (400 - Cannot Remove Owner):**
```json
{
  "status": "fail",
  "message": "Cannot remove team owner"
}
```

### 3. User Management APIs

#### GET /api/users
Get all users (requires authentication).

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": null,
    "role": "user",
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  }
]
```

#### GET /api/users/search?query=john&page=1&limit=20
Search users by name with pagination (requires authentication).

**Query Parameters:**
- `query` (required): Search term (case-insensitive, starts with)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Response:**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": null,
      "role": "user",
      "createdAt": "2025-01-20T10:30:00.000Z",
      "updatedAt": "2025-01-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Error Handling

All APIs return consistent error responses:

```json
{
  "status": "fail",
  "message": "Error description",
  "statusCode": 400
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Data Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  passwordHash: String (required),
  avatarUrl: String (optional),
  role: String (enum: ["user", "admin", "moderator"], default: "user"),
  refreshToken: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Team Model
```javascript
{
  name: String (required, unique),
  description: String (optional),
  owner: ObjectId (ref: "User", required),
  members: [ObjectId] (ref: "User"),
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

Use the provided `test-api.js` file to test all endpoints:

```bash
# Make sure the server is running
npm start

# In another terminal, run tests
node test-api.js
```

## Architecture

The backend follows a layered architecture:

1. **Routes** (`/routes/`) - Define API endpoints and middleware
2. **Controllers** (`/controllers/`) - Handle HTTP requests/responses
3. **Services** (`/service/`) - Business logic and validation
4. **Repository** (`/repository/`) - Data access and database operations
5. **Models** (`/models/`) - MongoDB schemas and models
6. **Middleware** (`/middleware/`) - Authentication and error handling
7. **Utils** (`/utils/`) - Helper functions and custom error classes

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Rate limiting (can be added)
