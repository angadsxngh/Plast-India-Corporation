import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const prisma = new PrismaClient();

const createProduct = asyncHandler(async(req, res) => {
    const { name, quantity, categoryId } = req.body;

    if(!name?.trim()){
        throw new ApiError(400, "Product name is required");
    }

    if(quantity === undefined || quantity === null || quantity === ""){
        throw new ApiError(400, "Quantity is required");
    }

    // Convert quantity to integer
    const qty = parseInt(quantity);
    if(isNaN(qty) || qty < 0){
        throw new ApiError(400, "Quantity must be a valid non-negative number");
    }

    const existingProduct = await prisma.product.findMany({
        where: {
            name: name,
            quantity: qty,
        }
    });

    if(existingProduct.length > 0){
        throw new ApiError(400, "Product with same name and quantity already exists");
    }

    if(!categoryId){
        const product = await prisma.product.create({
            data: {
                name: name,
                quantity: qty,
            }
        });
        return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
    } else{
        const product = await prisma.product.create({
            data: {
                name: name,
                quantity: qty,
                categoryId: categoryId
            }
        });
        return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
    }
})

const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, quantity } = req.body;
  
    if (!id?.trim()) {
      throw new ApiError(400, "Product ID is required");
    }
  
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
  
    const updateData = {};
    if (name) updateData.name = name.trim();
  
    if (quantity !== undefined && quantity !== null && quantity !== "") {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty < 0) {
        throw new ApiError(400, "Quantity must be a valid non-negative number");
      }
      updateData.quantity = qty;
    }
  
    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }
  
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });
  
    return res
      .status(200)
      .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
  });

const deleteProduct = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
        where: {
            id: id
        }
    });
    if(!product){
        throw new ApiError(404, "Product not found");
    }
    await prisma.product.delete({
        where: {
            id: id
        }
    });
    return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
})

const createCategory = asyncHandler(async(req, res) => {
    const { name } = req.body;
    if(!name?.trim()){
        throw new ApiError(400, "Category name is required");
    }
    const existingCategory = await prisma.category.findUnique({
        where: { name }
    });
    if(existingCategory){
        throw new ApiError(400, "Category already exists");
    }
    const category = await prisma.category.create({
        data: { name }
    });

    return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
})

const deleteCategory = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
        where: { id: id }
    });
    if(!category){
        throw new ApiError(404, "Category not found");
    }
    await prisma.category.delete({
        where: { id: id }
    });
    return res.status(200).json(new ApiResponse(200, {}, "Category deleted successfully"));
})  

const addProductToCategory = asyncHandler(async(req, res) => {
    const { categoryId, productId } = req.body;
    if(!categoryId?.trim() || !productId?.trim()){
        throw new ApiError(400, "Category ID and product ID are required");
    }
    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    if(!category){
        throw new ApiError(404, "Category not found");
    }
    const product = await prisma.product.findUnique({
        where: { id: productId }
    });
    if(!product){
        throw new ApiError(404, "Product not found");
    }
    const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: { products: { connect: { id: productId } } }
    });
    return res
    .status(200)
    .json(new ApiResponse(200, updatedCategory, "Product added to category successfully")); 
})

const removeProductFromCategory = asyncHandler(async(req, res) => {
    const { categoryId, productId } = req.body;
    if(!categoryId?.trim() || !productId?.trim()){
        throw new ApiError(400, "Category ID and product ID are required");
    }
    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    if(!category){
        throw new ApiError(404, "Category not found");
    }
    const product = await prisma.product.findUnique({
        where: { id: productId }
    });
    if(!product){
        throw new ApiError(404, "Product not found");
    }
    const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: { products: { disconnect: { id: productId } } }
    });
    return res
    .status(200)
    .json(new ApiResponse(200, updatedCategory, "Product removed from category successfully"));
})

const getCategories = asyncHandler(async(req, res) => {
    const categories = await prisma.category.findMany();
    return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
})

const getProducts = asyncHandler(async(req, res) => {
    const products = await prisma.product.findMany();
    return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
})

const createPurchaseOrder = asyncHandler(async(req, res) => {
    const { items } = req.body;
    if(!items?.length){
        throw new ApiError(400, "Items are required");
    }

    // Validate that all items have productId and quantity
    for(const item of items){
        if(!item.productId || !item.quantity){
            throw new ApiError(400, "Each item must have a productId and quantity");
        }
        if(item.quantity <= 0){
            throw new ApiError(400, "Quantity must be greater than 0");
        }
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
        // Create the purchase order first
        const purchaseOrder = await tx.purchaseOrder.create({
            data: {}
        });

        // Create purchase order items
        const orderItems = [];
        for(const item of items){
            const orderItem = await tx.purchaseOrderItem.create({
                data: {
                    purchaseOrderId: purchaseOrder.id,
                    productId: item.productId,
                    quantity: item.quantity
                },
                include: {
                    product: true
                }
            });
            orderItems.push(orderItem);
        }

        // Update product quantities (increment)
        for(const item of items){
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    quantity: {
                        increment: item.quantity
                    }
                }
            });
        }

        // Return the complete purchase order with items
        return {
            ...purchaseOrder,
            items: orderItems
        };
    });
    
    return res
    .status(201)
    .json(new ApiResponse(201, result, "Purchase order created successfully and inventory updated"));
})

const createSalesOrder = asyncHandler(async(req, res) => {
    const { items, partyId } = req.body;
    
    if(!partyId?.trim()){
        throw new ApiError(400, "Party ID is required");
    }

    if(!items?.length){
        throw new ApiError(400, "Items are required");
    }

    // Validate that all items have productId and quantity
    for(const item of items){
        if(!item.productId || !item.quantity){
            throw new ApiError(400, "Each item must have a productId and quantity");
        }
        if(item.quantity <= 0){
            throw new ApiError(400, "Quantity must be greater than 0");
        }
    }

    // Check if party exists
    const party = await prisma.party.findUnique({
        where: { id: partyId }
    });

    if(!party){
        throw new ApiError(404, "Party not found");
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
        // Create the sales order with party association
        const salesOrder = await tx.salesOrder.create({
            data: {
                partyId: partyId
            },
            include: {
                party: true
            }
        });

        // Create sales order items
        const orderItems = [];
        for(const item of items){
            const orderItem = await tx.salesOrderItem.create({
                data: {
                    salesOrderId: salesOrder.id,
                    productId: item.productId,
                    quantity: item.quantity
                },
                include: {
                    product: true
                }
            });
            orderItems.push(orderItem);
        }

        // Return the complete sales order with items
        return {
            ...salesOrder,
            items: orderItems
        };
    });
    
    return res
    .status(201)
    .json(new ApiResponse(201, result, "Sales order created successfully"));
})

const getPurchaseOrders = asyncHandler(async(req, res) => { 
    const purchaseOrders = await prisma.purchaseOrder.findMany({
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
    });
    return res
    .status(200)
    .json(new ApiResponse(200, purchaseOrders, "Purchase orders fetched successfully"));
})

const getSalesOrders = asyncHandler(async(req, res) => {
    const salesOrders = await prisma.salesOrder.findMany({
        include: {
            items: {
                include: {
                    product: true
                }
            },
            party: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return res
    .status(200)
    .json(new ApiResponse(200, salesOrders, "Sales orders fetched successfully"));
})

const createDispatchOrder = asyncHandler(async(req, res) => {
    const { salesOrderId, items } = req.body;
    
    if(!salesOrderId){
        throw new ApiError(400, "Sales Order ID is required");
    }
    
    if(!items?.length){
        throw new ApiError(400, "Items are required");
    }

    // Validate that all items have productId, productName, and quantity
    for(const item of items){
        if(!item.productId || !item.productName || !item.quantity){
            throw new ApiError(400, "Each item must have productId, productName, and quantity");
        }
        if(item.quantity <= 0){
            throw new ApiError(400, "Quantity must be greater than 0");
        }
    }

    // Check if products have sufficient quantity before creating dispatch
    for(const item of items){
        const product = await prisma.product.findUnique({
            where: { id: item.productId }
        });
        
        if(!product){
            throw new ApiError(404, `Product with id ${item.productId} not found`);
        }
        
        if(product.quantity < item.quantity){
            throw new ApiError(400, `Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
        }
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
        // Check if sales order exists
        const salesOrder = await tx.salesOrder.findUnique({
            where: { id: salesOrderId }
        });

        if(!salesOrder){
            throw new ApiError(404, "Sales order not found");
        }

        if(salesOrder.isDispatched){
            throw new ApiError(400, "This sales order has already been dispatched");
        }

        // Create the dispatch order first
        const dispatchOrder = await tx.dispatchOrder.create({
            data: {
                salesOrderId,
                isCompleted: false
            }
        });

        // Create dispatch order items
        const orderItems = [];
        for(const item of items){
            const orderItem = await tx.dispatchOrderItem.create({
                data: {
                    dispatchOrderId: dispatchOrder.id,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity
                }
            });
            orderItems.push(orderItem);
        }

        // Update product quantities (decrement for dispatch)
        for(const item of items){
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    quantity: {
                        decrement: item.quantity
                    }
                }
            });
        }

        // Return the complete dispatch order with items
        return {
            ...dispatchOrder,
            items: orderItems
        };
    });
    
    return res
    .status(201)
    .json(new ApiResponse(201, result, "Dispatch order created successfully and inventory updated"));
})

const getDispatchOrders = asyncHandler(async(req, res) => {
    const dispatchOrders = await prisma.dispatchOrder.findMany({
        include: {
            items: true,
            salesOrder: {
                include: {
                    party: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return res
    .status(200)
    .json(new ApiResponse(200, dispatchOrders, "Dispatch orders fetched successfully"));
})

const completeDispatchOrder = asyncHandler(async(req, res) => {
    const { id } = req.params;

    if(!id){
        throw new ApiError(400, "Dispatch order ID is required");
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
        // Get the dispatch order with all details
        const dispatchOrder = await tx.dispatchOrder.findUnique({
            where: { id },
            include: {
                items: true,
                salesOrder: {
                    include: {
                        party: true,
                        items: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if(!dispatchOrder){
            throw new ApiError(404, "Dispatch order not found");
        }

        if(dispatchOrder.isCompleted){
            throw new ApiError(400, "This dispatch order has already been completed");
        }

        // Mark dispatch order as completed
        const updatedDispatchOrder = await tx.dispatchOrder.update({
            where: { id },
            data: {
                isCompleted: true
            }
        });

        // Mark the associated sales order as dispatched
        await tx.salesOrder.update({
            where: { id: dispatchOrder.salesOrderId },
            data: {
                isDispatched: true
            }
        });

        // Return complete data for receipt generation
        return {
            ...updatedDispatchOrder,
            items: dispatchOrder.items,
            salesOrder: dispatchOrder.salesOrder
        };
    });

    return res
    .status(200)
    .json(new ApiResponse(200, result, "Dispatch order completed successfully"));
})

export {
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    addProductToCategory,
    removeProductFromCategory,
    deleteCategory,
    getCategories,
    getProducts,
    createPurchaseOrder,
    createSalesOrder,
    getPurchaseOrders,
    getSalesOrders,
    createDispatchOrder,
    getDispatchOrders,
    completeDispatchOrder,
}