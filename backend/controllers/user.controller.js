import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const convertUserDataToPDF = async (userData) => {
    const doc = new PDFDocument();
    const outputPath = crypto.randomBytes(32).toString('hex') + '.pdf';
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsPath, outputPath);

    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    if (
        userData.userId &&
        userData.userId.profilePicture
    ) {
        const profilePicturePath = path.join(
            uploadsPath,
            userData.userId.profilePicture
        );

        if (fs.existsSync(profilePicturePath)) {
            doc.image(profilePicturePath, {
                align: 'center',
                width: 150
            });
        }
    }

    doc.fontSize(14).text(
        `Name: ${userData.userId?.name || ''}`
    );

    doc.fontSize(14).text(
        `Email: ${userData.userId?.email || ''}`
    );

    doc.fontSize(14).text(
        `Username: ${userData.userId?.userName || ''}`
    );

    doc.fontSize(14).text(
        `Bio: ${userData.bio || ''}`
    );

    doc.fontSize(14).text(
        `Current Post: ${userData.currentPost || ''}`
    );

    doc.moveDown();

    doc.fontSize(16).text('Work Experience');

    if (userData.postWork && userData.postWork.length > 0) {
        userData.postWork.forEach((work) => {
            doc.fontSize(14).text(
                `Company: ${work.company || ''}`
            );

            doc.fontSize(14).text(
                `Position: ${work.position || ''}`
            );

            doc.fontSize(14).text(
                `Years: ${work.years || ''}`
            );

            doc.moveDown();
        });
    }

    doc.moveDown();

    doc.fontSize(16).text('Education');

    if (userData.education && userData.education.length > 0) {
        userData.education.forEach((education) => {
            doc.fontSize(14).text(
                `School: ${education.school || ''}`
            );

            doc.fontSize(14).text(
                `Degree: ${education.degree || ''}`
            );

            doc.fontSize(14).text(
                `Field of Study: ${education.fieldOfStudy || ''}`
            );

            doc.moveDown();
        });
    }

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve(outputPath);
        });

        stream.on('error', reject);
    });
};

export const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            userName
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !userName
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email },
                { userName }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email or username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            userName,
            active: false
        });

        await newUser.save();

        const profile = new Profile({
            userId: newUser._id
        });

        await profile.save();

        console.log(
            "USER REGISTERED:",
            newUser._id
        );

        return res.status(201).json({
            message: "User created successfully"
        });

    } catch (error) {
        console.error(
            "REGISTER ERROR:",
            error
        );

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email
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

        const token = crypto
            .randomBytes(32)
            .toString('hex');

        user.token = token;
        user.active = true;

        await user.save();

        console.log(
            "USER LOGGED IN:",
            user.email
        );

        return res.json({
            token,
            message: "Login successful"
        });

    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const uploadProfilePicture = async (
    req,
    res
) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Token is required"
            });
        }

        const user = await User.findOne({
            token
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

        return res.json({
            message:
                "Profile picture uploaded successfully",
            profilePicture:
                user.profilePicture
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

export const updateUserProfile = async (
    req,
    res
) => {
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
            token
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const {
            userName,
            email
        } = newUserData;

        if (userName || email) {
            const conditions = [];

            if (userName) {
                conditions.push({
                    userName
                });
            }

            if (email) {
                conditions.push({
                    email
                });
            }

            const existingUser =
                await User.findOne({
                    $or: conditions
                });

            if (
                existingUser &&
                String(existingUser._id) !==
                String(user._id)
            ) {
                return res.status(400).json({
                    message:
                        "Username or email already in use"
                });
            }
        }

        Object.assign(
            user,
            newUserData
        );

        await user.save();

        const safeUser =
            await User.findById(user._id)
                .select('-password -token');

        console.log(
            "UPDATED USER PROFILE:",
            safeUser
        );

        return res.json({
            message:
                "Profile updated successfully",
            user: safeUser
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

export const getUserAndProfile = async (
    req,
    res
) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                message: "Token is required"
            });
        }

        const user = await User.findOne({
            token
        }).select('-password -token');

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const userProfile =
            await Profile.findOne({
                userId: user._id
            });

        console.log(
            "USER FOUND:",
            user
        );

        console.log(
            "PROFILE FOUND:",
            userProfile
        );

        return res.json({
            user,
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

export const updateProfileData = async (
    req,
    res
) => {
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

        const user = await User.findOne({
            token
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const profile =
            await Profile.findOne({
                userId: user._id
            });

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        Object.assign(
            profile,
            newProfileData
        );

        await profile.save();

        console.log(
            "UPDATED PROFILE DATA:",
            profile
        );

        return res.json({
            message:
                "Profile data updated successfully",
            profile
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

export const getAllUserProfile = async (
    req,
    res
) => {
    try {
        const profiles =
            await Profile.find()
                .populate(
                    'userId',
                    'name email userName profilePicture active'
                );

        return res.json({
            profiles
        });

    } catch (error) {
        console.error(
            "GET ALL USER PROFILE ERROR:",
            error
        );

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const downloadFile = async (
    req,
    res
) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                message: "User id is required"
            });
        }

        const userProfile =
            await Profile.findOne({
                userId: id
            }).populate(
                'userId',
                'name email userName profilePicture'
            );

        if (!userProfile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        const outputPath =
            await convertUserDataToPDF(
                userProfile
            );

        return res.json({
            message: "PDF generated successfully",
            outputPath
        });

    } catch (error) {
        console.error(
            "DOWNLOAD FILE ERROR:",
            error
        );

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};