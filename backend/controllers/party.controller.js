import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const prisma = new PrismaClient();

// Log Prisma connection status
console.log("[Party Controller] Prisma client initialized");

const createParty = asyncHandler(async(req, res) => {
    const { name, contactNumber } = req.body;

    if(!name?.trim()){
        throw new ApiError(400, "Party name is required");
    }

    // Check if party with same name already exists
    const existingParty = await prisma.party.findFirst({
        where: {
            name: name.trim()
        }
    });

    if(existingParty){
        throw new ApiError(400, "Party with this name already exists");
    }

    // Build data object - only include contactNumber if provided
    const partyData = {
        name: name.trim()
    };
    
    // Only add contactNumber if it's provided and not empty
    if (contactNumber && contactNumber.trim()) {
        partyData.contactNumber = contactNumber.trim();
    }
    
    const party = await prisma.party.create({
        data: partyData
    });

    return res
        .status(201)
        .json(new ApiResponse(201, party, "Party created successfully"));
});

const getParties = asyncHandler(async(req, res) => {
    try {
        console.log("[getParties] Starting to fetch parties...");
        console.log("[getParties] Request user:", req.user?.id || "No user");
        console.log("[getParties] Request headers:", {
            authorization: req.headers.authorization ? "Present" : "Missing",
            cookies: req.cookies ? Object.keys(req.cookies) : "No cookies"
        });

        console.log("[getParties] Executing Prisma query...");
        console.log("[getParties] Prisma client status:", prisma ? "Initialized" : "Not initialized");
        
        let parties;
        try {
            parties = await prisma.party.findMany({
                include: {
                    salesOrders: {
                        include: {
                            items: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            console.log("[getParties] Prisma query executed successfully");
        } catch (prismaError) {
            console.error("[getParties] Prisma query error:", prismaError);
            console.error("[getParties] Prisma error code:", prismaError?.code);
            console.error("[getParties] Prisma error meta:", prismaError?.meta);
            throw prismaError;
        }

        console.log("[getParties] Query successful. Found", parties?.length || 0, "parties");
        
        // Log first party structure for debugging
        if (parties && parties.length > 0) {
            console.log("[getParties] Sample party structure:", {
                id: parties[0].id,
                name: parties[0].name,
                contactNumber: parties[0].contactNumber,
                salesOrdersCount: parties[0].salesOrders?.length || 0
            });
        }

        console.log("[getParties] Preparing response...");
        const response = new ApiResponse(200, parties, "Parties fetched successfully");
        console.log("[getParties] Response object created:", {
            statusCode: response.statusCode,
            success: response.success,
            message: response.message,
            dataLength: response.data?.length || 0
        });
        
        console.log("[getParties] Attempting to serialize response...");
        try {
            const jsonResponse = JSON.stringify(response);
            console.log("[getParties] Response serialized successfully. Length:", jsonResponse.length);
        } catch (serializeError) {
            console.error("[getParties] Serialization error:", serializeError);
            throw new Error(`Failed to serialize response: ${serializeError.message}`);
        }
        
        console.log("[getParties] Sending response...");
        return res
            .status(200)
            .json(response);
    } catch (error) {
        console.error("[getParties] ERROR:", error);
        console.error("[getParties] Error name:", error?.name);
        console.error("[getParties] Error message:", error?.message);
        console.error("[getParties] Error stack:", error?.stack);
        
        // Re-throw to let asyncHandler handle it
        throw error;
    }
});

const getPartyById = asyncHandler(async(req, res) => {
    const { id } = req.params;

    if(!id?.trim()){
        throw new ApiError(400, "Party ID is required");
    }

    const party = await prisma.party.findUnique({
        where: { id },
        include: {
            salesOrders: {
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    if(!party){
        throw new ApiError(404, "Party not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, party, "Party fetched successfully"));
});

const updateParty = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const { name, contactNumber } = req.body;

    if(!id?.trim()){
        throw new ApiError(400, "Party ID is required");
    }

    const party = await prisma.party.findUnique({ where: { id } });
    if(!party){
        throw new ApiError(404, "Party not found");
    }

    const updateData = {};
    if(name?.trim()) updateData.name = name.trim();
    if(contactNumber?.trim()) updateData.contactNumber = contactNumber.trim();

    if(Object.keys(updateData).length === 0){
        throw new ApiError(400, "No fields provided for update");
    }

    // Check if updating name would create duplicate
    if(updateData.name && updateData.name !== party.name){
        const existingParty = await prisma.party.findFirst({
            where: {
                name: updateData.name,
                id: { not: id }
            }
        });
        if(existingParty){
            throw new ApiError(400, "Party with this name already exists");
        }
    }

    const updatedParty = await prisma.party.update({
        where: { id },
        data: updateData
    });

    return res
        .status(200)
        .json(new ApiResponse(200, updatedParty, "Party updated successfully"));
});

const deleteParty = asyncHandler(async(req, res) => {
    const { id } = req.params;

    if(!id?.trim()){
        throw new ApiError(400, "Party ID is required");
    }

    const party = await prisma.party.findUnique({
        where: { id }
    });

    if(!party){
        throw new ApiError(404, "Party not found");
    }

    await prisma.party.delete({
        where: { id }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Party deleted successfully"));
});

export {
    createParty,
    getParties,
    getPartyById,
    updateParty,
    deleteParty
};

