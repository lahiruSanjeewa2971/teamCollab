export const createTeam = async (req, res, next) => {
    try {
        const {name, members} = req.body;
        
    } catch (error) {
        console.log('Error in team creation Controller :', error);
        next(error);
    }
}