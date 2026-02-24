import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
import { ApiError } from "../utils/ApiError.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); 

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        console.log("[verifyJWT] Starting authentication check...");
        console.log("[verifyJWT] Request path:", req.path);
        console.log("[verifyJWT] Request method:", req.method);
        console.log("[verifyJWT] Cookies:", req.cookies ? Object.keys(req.cookies) : "No cookies");
        console.log("[verifyJWT] Authorization header:", req.header("Authorization") ? "Present" : "Missing");
        
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        console.log("[verifyJWT] Token found:", token ? "Yes (length: " + token.length + ")" : "No");

        if(!token){
            console.log("[verifyJWT] No token found - throwing 401");
            throw new ApiError(401, "Unauthorized request")
        }

        console.log("[verifyJWT] Verifying token...");
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("[verifyJWT] Token decoded successfully. User ID:", decodedToken.id);

        console.log("[verifyJWT] Fetching user from database...");
        const user = await prisma.user.findFirst({
            where:{
                id: decodedToken.id
            }
        })

        if(!user){
            console.log("[verifyJWT] User not found in database - throwing 401");
            throw new ApiError(401, "Invalid access token")
        }

        console.log("[verifyJWT] User found:", user.email);
        req.user = user;
        console.log("[verifyJWT] Authentication successful. Calling next()...");
        next();

    } catch (error) {
        console.error("[verifyJWT] Authentication error:", error?.name, error?.message);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})