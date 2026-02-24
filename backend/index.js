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

// Verify Prisma client is generated and test connection
async function initializePrisma() {
    try {
        console.log("[INIT] Testing Prisma connection...");
        await prisma.$connect();
        console.log("[INIT] Prisma connected successfully");
        
        // Test query to verify schema is in sync
        try {
            const testParty = await prisma.party.findFirst({
                select: { id: true, name: true, contactNumber: true }
            });
            console.log("[INIT] Prisma schema test successful");
        } catch (schemaError) {
            console.error("[INIT] WARNING: Prisma schema may be out of sync!");
            console.error("[INIT] Schema error:", schemaError.message);
            console.error("[INIT] Please run: npx prisma generate && npx prisma db push");
        }
    } catch (error) {
        console.error("[INIT] Prisma connection failed:", error);
        process.exit(1);
    }
}

initializePrisma();

const app = express();
const PORT=process.env.PORT || 3000;

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            "http://localhost:5173",
            "https://plast-india-corporation-l9qz.vercel.app",
        ];
        
        // Check if origin is a Vercel deployment
        if (origin.includes("vercel.app")) {
            return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,   
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: '16kb'}))
app.use(express.static('public'))
app.use(cookieParser())
app.use(bodyParser.json())

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log(`[REQUEST] Origin: ${req.headers.origin || 'No origin'}`);
    console.log(`[REQUEST] Cookies: ${req.cookies ? Object.keys(req.cookies).join(', ') : 'No cookies'}`);
    next();
});

app.listen(PORT, ()=> {
    console.log("server running on port ",PORT);
    console.log("Environment:", process.env.NODE_ENV || "development");
})

app.get('/', (req,res) => {
    res.send("Hello World");
})

app.use('/', userRouter)
app.use('/', productRouter)
app.use('/', partyRouter)

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log error details for debugging
    console.error("[ERROR HANDLER] ========================================");
    console.error("[ERROR HANDLER] Status Code:", statusCode);
    console.error("[ERROR HANDLER] Message:", message);
    console.error("[ERROR HANDLER] Error Name:", err?.name);
    console.error("[ERROR HANDLER] Error Stack:", err?.stack);
    console.error("[ERROR HANDLER] Request Path:", req.path);
    console.error("[ERROR HANDLER] Request Method:", req.method);
    console.error("[ERROR HANDLER] Request Body:", req.body);
    console.error("[ERROR HANDLER] ========================================");
    
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
        // Include stack trace in development (remove in production if needed)
        ...(process.env.NODE_ENV !== 'production' && { stack: err?.stack })
    });
});

export {app}