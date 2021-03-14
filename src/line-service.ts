import * as request from 'request';
import * as crypto from 'crypto';

const LineChannel = {
    TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN as string,
    SECRET: process.env.LINE_CHANNEL_SECRET as string,
}

export function verifySignature(body: string, requestSignature: string): void {
    const signature = crypto.createHmac('SHA256', LineChannel.SECRET)
        .update(body)
        .digest('base64');
    if (requestSignature !== signature) {
        console.log('invalid signature');
        throw new Error('invalid signature');
    }
}

export function reply(replyToken: string, msg: string) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LineChannel.TOKEN}`
    }
    let body = JSON.stringify({
        replyToken: replyToken,
        messages: [{
            type: 'text',
            text: `${msg}!`
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