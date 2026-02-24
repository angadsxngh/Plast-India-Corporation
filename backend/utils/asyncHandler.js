const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => {
            console.error("[asyncHandler] Caught error:", err?.name, err?.message);
            console.error("[asyncHandler] Error stack:", err?.stack);
            next(err);
        })
}}

export {asyncHandler}