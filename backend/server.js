import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import postRoutes from './routes/postRoutes.js';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

const start = async() => {
    const connectDB = await mongoose.connect("mongodb+srv://jack912062sharmas_db_user:0H6VzHqirDhDy8bS@linkedinclone.hdr1cib.mongodb.net/linkedinclone")
}
app.listen(9090 , ()=>{
    console.log("Server is running on port 9090");
})
start();