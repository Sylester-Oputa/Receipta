import { AnyZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export const validate = (schema: {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
}) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new AppError(400, "Validation failed", "VALIDATION_ERROR", error.flatten()));
    }
    return next(error);
  }
};
