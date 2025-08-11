import {getAllUsers, searchUsersByName} from '../repository/user.repository.js';

export const getAllUsersService = async () => {
    return await getAllUsers();
}

// Search users by name with pagination
export const searchUsersByNameService = async (query, page, limit) => {
    if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw new Error('Invalid pagination parameters');
    }
    
    return await searchUsersByName(query.trim(), pageNum, limitNum);
}