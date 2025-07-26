import {getAllUsers} from '../repository/user.repository.js';

export const getAllUsersService = async () => {
    return await getAllUsers();
}