import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import error from './middlewares/error.js';
import ErrorHandler from './utils/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import { auth } from './middlewares/authMiddleware.js';
import chatRouter from './routes/chat.js';

dotenv.config();
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors({
    origin:"*",
    methods:["GET","POST","DELETE","UPDATE","PUT","PATCH"],
    credentials: true,
}))

app.get('/',(req,res)=>{
    res.json({message:'Welcome to Travel buddy server'});
})

const cors = require('cors');

// CORS configuration
app.use(cors({
    origin: [
        'https://mern-frontend-beta.vercel.app',
        'http://localhost:3000'  // for local development
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: ['*', 'Authorization']
}));

// Make sure this CORS configuration is placed BEFORE your routes


app.use('/api',authRoutes);
app.use('/api/trips',auth,tripRoutes);
app.use('/api/chat',chatRouter);

app.all('*',async(req,res,next)=>{
    return next(new ErrorHandler('Not Found. Kindly check the API path as well as request type', 404));
})

app.use(error)

export default app;