import { NextFunction, Request, Response } from 'express';

export function bodylogMiddleware(req: Request, res: Response, next: NextFunction) {
    const { body } = req;
    const logPayload = {
        type: 'line-webhook',
        response: body
    };
    console.log(JSON.stringify(logPayload));
    next();
}
