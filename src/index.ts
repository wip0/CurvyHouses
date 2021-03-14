import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as lineService from './line-service';
const serverless = require('serverless-http');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  const result = {
    data: {
      'message': 'setup from webpack!'
    }
  };
  res.json(result);
})

app.post('/webhook/line', async(req, res) => {
  const reqSignature = req.header('x-line-signature');
  if (!reqSignature) {
    console.log('invalid signature');
    throw new Error('invalid signature');
  }
  lineService.verifySignature(JSON.stringify(req.body), reqSignature);
  if (req.body && req.body.events && req.body.events[0] && req.body.events[0].message) {
    const obj = req.body.events[0];
    const { replyToken, message } = obj;
    await lineService.reply(replyToken, message.text);
  }
  res.sendStatus(200);
});

export const handler = serverless(app);
