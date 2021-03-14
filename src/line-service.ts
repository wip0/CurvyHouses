import * as request from 'request';
import * as crypto from 'crypto';
import { Request } from 'express';

const LineChannel = {
    TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN as string,
    SECRET: process.env.LINE_CHANNEL_SECRET as string,
}

const GREEN_COLOR = '#00bf33';
const RED_COLOR = '#dd0000';
const GREY_COLOR = '#666666';
const FIX_DECIMAL_PLACE = 2;

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

export function buildSeperator() {
    return {
      type: 'separator',
      margin: 'xl'
    };
}

export function buildEodFlexMessage(symbol: string, open: number, close: number, high: number, low: number, volume: number, adjOpen: number, adjClose: number, adjHigh: number, adjLow: number, fullDetail: boolean = false) {
    const change = close - open;
    const changePercentage = numberWithCommas(change / open * 100);
    const sumColor = change > 0 ? GREEN_COLOR : change < 0 ? RED_COLOR : GREY_COLOR;

    const defaultData: any[] = [
        buildEodDataBox('Open', numberWithCommas(open)),
        buildEodDataBox('Close', numberWithCommas(close)),
        buildEodDataBox('High', numberWithCommas(high), GREEN_COLOR),
        buildEodDataBox('Low', numberWithCommas(low), RED_COLOR),
    ];

    const adjustData: any[] = [
        buildEodDataBox('Adj.Open', numberWithCommas(adjOpen)),
        buildEodDataBox('Adj.Close', numberWithCommas(adjClose)),
        buildEodDataBox('Adj.High', numberWithCommas(adjHigh), GREEN_COLOR),
        buildEodDataBox('Adj.Low', numberWithCommas(adjLow), RED_COLOR),
    ];

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
                        size: 'md',
                        margin: 'md',
                    },
                    {
                      type: 'text',
                      text: String(close),
                      size: 'xxl',
                      weight: 'bold',
                      color: sumColor,
                    },
                    {
                      type: 'text',
                      text: `(${changePercentage}%)`,
                      size: 'xxs',
                      color: sumColor,
                    },
                    {
                      type: 'text',
                      text: `Volume ${numberWithCommas(volume, 0)}`,
                      size: 'xxs',
                      color: GREY_COLOR,
                    },
                    buildSeperator(),
                    {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: defaultData,
                    },
                    ...fullDetail ? [
                        buildSeperator(),
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: adjustData,
                        },
                    ] : [],
                ]
            }
        }
    }
}

export function buildEodDataBox(key: string, value: string, color?: string) {
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
                flex: 1,
            },
            {
                type: 'text',
                text: value,
                wrap: true,
                color: color ?? '#666666',
                size: 'sm',
                flex: 3,
                align: 'end',
                weight: 'bold',
            }
        ]
    }
}

function numberWithCommas(num: number, fixDecimal: number = FIX_DECIMAL_PLACE) {
    return num.toFixed(fixDecimal).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
