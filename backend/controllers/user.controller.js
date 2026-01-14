import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { findUserByEmail, validatePassword, generateAccessToken, generateRefreshToken } from "../services/user.services.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateOTP, sendOTPEmail } from "../utils/TwoStepAuth.js";

const prisma = new PrismaClient();

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, number, otp } = req.body;
  
    if ([name, email, password, number, otp].some((f) => !f?.trim())) {
      throw new ApiError(400, "All fields are required");
    }
  
    const otpRecord = await prisma.emailOTP.findUnique({ where: { email } });
  
    if (!otpRecord) throw new ApiError(400, "No OTP found for this email");
    if (otpRecord.expiresAt < new Date()) throw new ApiError(400, "OTP expired");
    if (otpRecord.otp !== otp) throw new ApiError(400, "Invalid OTP");
  
    await prisma.emailOTP.update({
      where: { email },
      data: { verified: true },
    });
  
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new ApiError(400, "Email already exists");
  
    const existingNumber = await prisma.user.findFirst({ where: { number } });
    if (existingNumber) throw new ApiError(400, "Number already exists");
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, number, role: "user" },
    });

    await prisma.emailOTP.delete({
        where: { email: email }
    });
    
    return res
      .status(201)
      .json(new ApiResponse(201, user, "User registered successfully"));
  });
  

const sendRegistrationOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    if (!email?.trim()) {
      throw new ApiError(400, "Email is required");
    }
  
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(400, "Email already registered");
    }
  
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 
  
    const existingOtp = await prisma.emailOTP.findUnique({ where: { email } });
    if (existingOtp) {
      await prisma.emailOTP.update({
        where: { email },
        data: { otp, expiresAt, verified: false },
      });
    } else {
      await prisma.emailOTP.create({
        data: { email, otp, expiresAt },
      });
    }
  
    await sendOTPEmail(email, otp);
  
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "OTP sent successfully to your email"));
  });
  

const loginUser = asyncHandler(async(req, res) => {
    const {email, password} = req.body;

    if([email, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    const user = await findUserByEmail(email);

    if(!user){
        throw new ApiError(400, "Invalid email or password");
    }

    const isPasswordValid = await validatePassword(password, user.password);

    if(!isPasswordValid){
        throw new ApiError(400, "Invalid email or password");
    }

    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    }

    res
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    
    return res.send(user)
})

//secured routes

const logoutUser = asyncHandler(async(req, res) => {
    res.clearCookie("refreshToken")
    res.clearCookie("accessToken")
    return res.send({message: "Logged out successfully"})
})

const refreshAccessToken = asyncHandler(async(req,res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        console.log("decoded token: ",decodedToken);

        const user = await prisma.user.findFirst({
            where:{
                id: decodedToken.id
            }
        })

        console.log("user", user);
        

        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }

        console.log("Incoming refresh token: ",incomingRefreshToken);
        console.log("user refresh token: ",user.refreshToken);
        

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
        }

        const accessToken = generateAccessToken(user)
        const newRefreshToken = generateRefreshToken(user)

        return res
        .send(200)
        .cookie("access token", accessToken, options)
        .cookie("refresh token", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "access token refreshed"
            )
        )

    } catch (error) {
        
        throw new ApiError(401, error?.message || "invalid refresh token")

    }
})

const getUser = asyncHandler(async(req,res) => {
    const user = await prisma.user.findFirst({
        where: {
            id: req.user?.id
        }
    })
    return res.send(user)
})

const changeRole = asyncHandler(async(req,res) => {
    const id = req.params.id;
    const {role} = req.body;

    if(!id?.trim() || !role?.trim()){
        throw new ApiError(400, "All fields are required");
    }

    const user = await prisma.user.findUnique({
        where: { id: id }
    });
    
    if(!user){
        throw new ApiError(404, "User not found");
    }

    await prisma.user.update({
        where: { id: id },
        data: { role: role }
    });
    return res.status(200).json(new ApiResponse(200, {}, "Role changed successfully"));
})

const changePassword = asyncHandler(async(req,res) => {
    
    const {newPassword, oldPassword} = req.body

    const user = await prisma.user.findFirst({
        where:{
            id: req.user?.id
        }
    })

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password")
    }

    user.password = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
        where: { id: user.id },
        data: {password: await bcrypt.hash(newPassword, 10) }
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated succesfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {

    const { name, number, email, role } = req.body;

    console.log(req.body)


    const user = await prisma.user.findFirst({
        where: {
            id: req.user.id
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if(number){
        user.number = number
        await prisma.user.update({
            where: { id: user.id },
            data: {number: number}
        })
    }

    if(email){
        user.email = email
        await prisma.user.update({
            where: { id: user.id },
            data: {email: email}
        })
    }

    if(name){
        user.name = name
        await prisma.user.update({
            where: { id: user.id },
            data: {name: name}
        })
    }

    if(role){
        user.role = role
        await prisma.user.update({
            where: { id: user.id },
            data: {role: role}
        })
    }

    return res.send(user)
});

export {
    registerUser,
    sendRegistrationOTP,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    updateAccountDetails,
    changeRole,
    getUser
}