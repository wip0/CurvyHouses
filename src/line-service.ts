import * as request from 'request';
import * as crypto from 'crypto';
import { Request } from 'express';

const LineChannel = {
    TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN as string,
    SECRET: process.env.LINE_CHANNEL_SECRET as string,
}

export interface LineReqEvent {
    message: {
        text: string;
    };
    replyToken: string;
}

export interface LineReqBody {
    events: LineReqEvent[];
}

export function verifySignature(req: Request<any, any, LineReqBody, any, Record<string, any>>) {
    const requestSignature = req.header('x-line-signature');
    if (!requestSignature) {
        console.log('Invalid signature');
        throw new Error('Invalid signature');
    }
    const body = req.body;
    const signature = crypto.createHmac('SHA256', LineChannel.SECRET)
        .update(JSON.stringify(body))
        .digest('base64');
    if (requestSignature !== signature) {
        console.log('Invalid signature');
        throw new Error('Invalid signature');
    }
}

export function validateLinePayload(body: LineReqBody | any): body is LineReqBody {
    return !!body?.events;
}

export function logPayloadDebug(body: LineReqBody) {
    const debugLog = {
        type: 'line-webhook',
        response: body
    };
    console.log(JSON.stringify(debugLog));
}


export function reply(replyToken: string, text: string) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LineChannel.TOKEN}`
    }
    let body = JSON.stringify({
        replyToken: replyToken,
        messages: [{
            type: 'text',
            text
        }]
    })
    return new Promise<void>((resolve, reject) => {
        request.post({
            url: 'https://api.line.me/v2/bot/message/reply',
            headers: headers,
            body: body
        }, (err: Error, res: any, body: string) => {
            if (err) {
                console.log(err);
            }
            console.log('status = ' + res.statusCode);
            resolve();
        });
    })
}