import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';

const activeCheck = async (req, res) => {
    return res.status(200).json({ message: "Active" });
}
export default activeCheck;

