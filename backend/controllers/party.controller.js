import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const prisma = new PrismaClient();

const createParty = asyncHandler(async(req, res) => {
    const { name, contactNumber } = req.body;

    if(!name?.trim()){
        throw new ApiError(400, "Party name is required");
    }

    if(!contactNumber?.trim()){
        throw new ApiError(400, "Contact number is required");
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

    const party = await prisma.party.create({
        data: {
            name: name.trim(),
            contactNumber: contactNumber.trim()
        }
    });

    return res
        .status(201)
        .json(new ApiResponse(201, party, "Party created successfully"));
});

const getParties = asyncHandler(async(req, res) => {
    const parties = await prisma.party.findMany({
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

    return res
        .status(200)
        .json(new ApiResponse(200, parties, "Parties fetched successfully"));
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

