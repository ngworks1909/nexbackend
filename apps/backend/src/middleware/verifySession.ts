import { NextFunction, Response, Request } from 'express';
import jwt from 'jsonwebtoken'

export interface User{
    userId?: string
}

interface userJwtClaims {
  user: {
    userId: string
  }
}

export type UserRequest = Request & User


export function verifySession(req: UserRequest, res: Response, next: NextFunction) {
  const token = req.headers['authorization'] // Assuming Bearer token format

  if (!token) {
    return res.status(401).send('Unauthorized token'); // Unauthorized
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as userJwtClaims;
    if(!decoded.user.userId){
        return res.status(400).json({success: false, message: "Invalid token"})
    }
    else{
        req.userId = decoded.user.userId
        next();
    }
  } catch (error) {
    return res.status(403).send('Forbidden error');
  }
}