import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';



export const register = async (req, res) => {
    try{
         const { name, email, password, userName } = req.body;
         if(!name || !email || !password || !userName){
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
            userName
         });
            await newUser.save();

            const profile = new Profile({userId: newUser._id});
            await profile.save();
            return res.status(201).json({ message: "User created successfully" });

    } catch(error){
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
        message: "Server error",
        error: error.message});
    }
}

export const login = async (req, res) => {
    try{
        const { email, password } = req.body;
         if(!email || !password){
            return res.status(400).json({ message: "Email and password are required" });
         }
         const user = await User.findOne({
            email: email
         });
         if(!user){
            return res.status(404).json({ message: "Invalid credentials" });
         }
         const isMatch = await bcrypt.compare(password, user.password);
         if(!isMatch){
            return res.status(404).json({ message: "Invalid credentials" });
         }
         const token = crypto.randomBytes(32).toString('hex');

         await User.updateOne({ _id: user._id }, { token: token });

         return res.json({ token: token, message: "Login successful" });
         
    } catch(error){
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}
