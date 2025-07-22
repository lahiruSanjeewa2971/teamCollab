import AppError from "../utils/AppError.js";

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log the error for debugging
  console.error("Error:", err);
  // Send the error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || "An unexpected error occurred",
  });
};
export default errorMiddleware;
