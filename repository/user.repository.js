import User from "../models/User.js";

export const getAllUsers = async () => {
    return await User.find().select('-password');
}

// Search users by name (case-insensitive, starts with query)
export const searchUsersByName = async (query, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    
    const users = await User.find({
        name: { $regex: `^${query}`, $options: 'i' }
    })
    .select('-password -refreshToken')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
    
    const total = await User.countDocuments({
        name: { $regex: `^${query}`, $options: 'i' }
    });
    
    return {
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};