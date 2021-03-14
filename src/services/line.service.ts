import * as crypto from 'crypto';
import { Request } from 'express';
import * as request from 'request';
import { LineChannel } from '../constant';
import { LineReqBody } from '../interfaces';

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

export function reply(replyToken: string, message: any) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LineChannel.TOKEN}`
    }
    let body = JSON.stringify({
        replyToken: replyToken,
        messages: [message]
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
