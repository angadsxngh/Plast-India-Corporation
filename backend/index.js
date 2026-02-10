import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.router.js';
import productRouter from './routes/product.routes.js';
import partyRouter from './routes/party.routes.js';

const prisma = new PrismaClient()

const app = express();
const PORT=process.env.PORT || 3000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials:true,   
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: '16kb'}))
app.use(express.static('public'))
app.use(cookieParser())
app.use(bodyParser.json())

app.listen(3000, ()=> {
    console.log("server running on port ",PORT);
})

app.get('/', (req,res) => {
    res.send("Hello World");
})

app.use('/api/v1', userRouter)
app.use('/api/v1', productRouter)
app.use('/api/v1', partyRouter)

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || []
    });
});

export {app}