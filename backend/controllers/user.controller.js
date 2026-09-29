import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import fs from 'fs';


const convertUserDataToPDF = async (userData) => {
      const doc = new PDFDocument();
      const outputPath = crypto.randomBytes(32).toString('hex') + '.pdf';
      const stream = fs.createWriteStream("uploads/" + outputPath);
      doc.pipe(stream);
      
}
   

export const register = async (req, res) => {
    try {
        const { name, email, password, userName } = req.body;

        if (!name || !email || !password || !userName) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const user = await User.findOne({
            email: email
        });

        if (user) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            userName
        });

        await newUser.save();

        // Create empty profile for new user
        const profile = new Profile({
            userId: newUser._id
        });

        await profile.save();

        console.log("USER REGISTERED:", newUser._id);

        return res.status(201).json({
            message: "User created successfully"
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==================== LOGIN ====================

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // Generate login token
        const token = crypto.randomBytes(32).toString('hex');

        await User.updateOne(
            { _id: user._id },
            { token: token }
        );

        console.log("USER LOGGED IN:", user.email);

        return res.json({
            token: token,
            message: "Login successful"
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==================== UPLOAD PROFILE PICTURE ====================

export const uploadProfilePicture = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Token is required"
            });
        }

        const user = await User.findOne({
            token: token
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Profile picture is required"
            });
        }

        user.profilePicture = req.file.filename;

        await user.save();

        console.log(
            "PROFILE PICTURE UPDATED:",
            user.profilePicture
        );

        return res.json({
            message: "Profile picture uploaded successfully",
            profilePicture: user.profilePicture
        });

    } catch (error) {
        console.error(
            "UPLOAD PROFILE PICTURE ERROR:",
            error
        );

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==================== UPDATE USER PROFILE ====================

export const updateUserProfile = async (req, res) => {
    try {
        const {
            token,
            ...newUserData
        } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Token is required"
            });
        }

        const user = await User.findOne({
            token: token
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // IMPORTANT: userName, not username
        const {
            userName,
            email
        } = newUserData;

        // Check if another user already has same username/email
        if (userName || email) {

            const existingUser = await User.findOne({
                $or: [
                    ...(userName ? [{ userName }] : []),
                    ...(email ? [{ email }] : [])
                ]
            });

            if (
                existingUser &&
                String(existingUser._id) !== String(user._id)
            ) {
                return res.status(400).json({
                    message: "Username or email already in use"
                });
            }
        }

        // Update user
        Object.assign(user, newUserData);

        await user.save();

        console.log(
            "UPDATED USER PROFILE:",
            user
        );

        return res.json({
            message: "Profile updated successfully",
            user: user
        });

    } catch (error) {
        console.error(
            "UPDATE USER PROFILE ERROR:",
            error
        );

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==================== GET USER AND PROFILE ====================

export const getUserAndProfile = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                message: "Token is required"
            });
        }

        const user = await User.findOne({
            token: token
        }).select('-password');

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        console.log(
            "USER FOUND:",
            user
        );

        const userProfile = await Profile.findOne({
            userId: user._id
        }).populate(
            'userId',
            'name email userName profilePicture'
        );

        console.log(
            "PROFILE FOUND:",
            userProfile
        );

        return res.json({
            user: user,
            profile: userProfile
        });

    } catch (error) {
        console.error(
            "GET USER AND PROFILE ERROR:",
            error
        );

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==================== UPDATE PROFILE DATA ====================

export const updateProfileData = async (req, res) => {
    try {
        const {
            token,
            ...newProfileData
        } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Token is required"
            });
        }

        // Find user using token
        const user = await User.findOne({
            token: token
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Find profile
        const profile = await Profile.findOne({
            userId: user._id
        });

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        // Update profile
        Object.assign(
            profile,
            newProfileData
        );

        await profile.save();

        // Show updated data in terminal
        console.log(
            "UPDATED PROFILE DATA:",
            profile
        );

        return res.json({
            message: "Profile data updated successfully",
            profile: profile
        });

    } catch (error) {
        console.error(
            "UPDATE PROFILE DATA ERROR:",
            error
        );

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const getAllUserProfile  = async (req, res) => {
      try { 
         const profiles = await Profile.find().populate('userId', 'name email userName profilePicture');
         return res.json({profiles});

      }catch (error) {
       return res.status(500).json({
            message: "Server error",
            error: error.message
        });
      }
   }

export const downloadFile = async (req, res) => {  
   const user_id =req.query.id;
   const userProfile = await Profile.findOne({userId:user_id}).populate('userId', 'name email userName profilePicture');

   let a = await convertUserDataToPDF(userProfile);
   return res.json({message:"PDF generated successfully",pdf:a});
}

