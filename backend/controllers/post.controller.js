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
                message: "Server error crash",
                error: error.message
            });
        }
    }   

export const deletePost = async (req, res) => {
    const {token , post_Id} = req.body;
    try{
        const user = await User.findOne({token: token})
        .select('_id'); 

        if(!user){
            return res.status(404).json({ message: "User not found" });
        }

        const post = await Post.findOne({ _id: post_Id});
        if(!post){
            return res.status(404).json({ message: "Post not found" });
        }
        if(post.userId.toString() !== user._id.toString()){
            return res.status(403).json({ message: "You are not authorized to delete this post" });
        }

        await Post.deleteOne({ _id: post_Id });
        return res.status(200).json({ message: "Post deleted successfully" });


    }catch (error) {
        return res.status(500).json({
            message: "Server error crash",  
            error: error.message
        });
    }
}

export const get_comments_by_post = async (req, res) => {
    const { postId } = req.body;

    try {
        const post = await Post.findOne({ _id: postId });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const comments = await Comment.find({ postId }).populate('userId', 'name email userName profilePicture');

        return res.status(200).json({ comments : post.comments });

    } catch (error) {
        return res.status(500).json({
            message: "Server error s",
            error: error.message
        });
    }
};

export const delete_comment_of_user = async (req, res) => { 
    const { token, commentId } = req.body;
    try{
        const user = await User.findOne({ token }).select('_id');
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }

        const comment = await Comment.findOne({ "_id": commentId, "userId": user._id });
        if(!comment){
            return res.status(404).json({ message: "Comment not found" });
        }

        if(comment.userId.toString()!== user._id.toString()){
            return res.status(404).json({ message: "Unauthorized" });
        }

        await Comment.deleteOne({ _id: commentId });
        return res.status(200).json({ message: "Comment deleted successfully" });
    }catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const increment_likes = async(req,res)=>{
    const {post_id} = req.body;

    try{
        const post = await Post.findOne({ _id: post_id });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        post.likes += 1;
        await post.save();
        return res.status(200).json({ message: "Like incremented successfully", likes: post.likes });

    }catch(error){
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}
