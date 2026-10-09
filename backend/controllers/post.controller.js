import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';

export const activeCheck = async (req, res) => {
    return res.status(200).json({ message: "Active" });
}

export const createPost = async (req, res) => {
    const {token} = req.body;

    try{
        const user = await User.findOne({token: token});
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        const post = new Post({
            userId: user._id,
            body: req.body.body,
            media: req.file != undefined ? req.file.filename : "",
            fileType: req.file != undefined ? req.file.mimetype.split('/')[1]: "",

        });
        await post.save();
        
        return res.status(201).json({ message: "Post created successfully" });

    }catch (err){
        console.log(err);
        return res.status(500).json({ message: "Error creating post" });
    }
}

 export const getAllPosts = async (req, res) => {
        try{
            const posts = await Post.find().populate('userId', 'name email userName profilePicture');
            return res.status(200).json({posts});
        }catch (error) {
            return res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    }   