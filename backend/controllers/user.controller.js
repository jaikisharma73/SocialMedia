import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';

const register = async (req, res) => {
    try{
         const { name, email, password, username } = req.body;
         if(!name || !email || !password || !username){
            return res.status(400).json({ message: "All fields are required" });
         }
         const user = await User.findOne({
            email: email
         });
         if(user){
            return res.status(400).json({ message: "User already exists" });
         }
         const hashedPassword = await bcrypt.hash(password, 10);
         const newUser = new User({
            name,
            email,
            password: hashedPassword,
            username
         });
            await newUser.save();

            const profile = new Profile({userId: newUser._id});
            await profile.save();
            return res.status(201).json({ message: "User created successfully" });

    } catch(error){
        return res.status(500).json({ message: "Server error" });
    }
}
export default register;