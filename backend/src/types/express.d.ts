import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    file?: Express.Multer.File;
    user?: {
      id: string;
      businessId: string;
      role: string;
    };
  }
}
