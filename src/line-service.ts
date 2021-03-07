import * as request from 'request'
const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

export function reply(replyToken: string, msg: string) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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