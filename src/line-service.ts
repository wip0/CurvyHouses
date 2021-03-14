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

export function buildTextMessage(text: string) {
    return {
        type: 'text',
        text
    };
}

export function buildEodFlexMessage(symbol: string, open: number, close: number, high: number, low: number, volume: number) {
    return {
        type: 'flex',
        altText: `Show ${symbol}`,
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: symbol,
                        weight: 'bold',
                        size: 'xl'
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: [
                            buildEodDataBox('Open', String(open)),
                            buildEodDataBox('Close', String(close)),
                            buildEodDataBox('High', String(high)),
                            buildEodDataBox('Low', String(low)),
                            buildEodDataBox('Volume', String(volume)),
                        ]
                    }
                ]
            }
        }
    }
}

export function buildEodDataBox(key: string, value: string) {
    return {
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
            {
                type: 'text',
                text: key,
                color: '#aaaaaa',
                size: 'sm',
                flex: 1
            },
            {
                type: 'text',
                text: value,
                wrap: true,
                color: '#666666',
                size: 'sm',
                flex: 3,
                align: 'end'
            }
        ]
    }
}