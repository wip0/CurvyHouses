import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as dataService from './data-service';
import * as lineService from './line-service';
import { LineReqBody } from './line-service';
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

app.post('/webhook/line', async(req: express.Request<any, any, LineReqBody, any, Record<string, any>>, res) => {
  const body = req.body;
  lineService.verifySignature(req);
  if (!lineService.validateLinePayload(body)) {
    console.log('Invalid payload');
    throw new Error('Invalid payload');
  }
  lineService.logPayloadDebug(body);

  const { events } = body;
  const processPromises = events.map(async (event) => {
    const { replyToken, message } = event;
    const userMessage = message.text;
    if (!userMessage.startsWith('#')) {
      console.log('skip non-command message');
      return;
    }
    const [commandWithPrefix, ...params] = userMessage.split(' ');
    const command = commandWithPrefix.substr(1).toLowerCase();
    switch (command) {
      case 'show':
        const symbol = params[0];
        const eodResponse = await dataService.getEodData(symbol);
        const data = eodResponse?.data[0];
        const { open, close, high, low, volume } = data;
        await lineService.reply(replyToken, lineService.buildEodFlexMessage(symbol, open, close, high, low, volume));
        break;
      default:
        await lineService.reply(replyToken, lineService.buildTextMessage('Invalid command'));
        break;
    }
  });
  await Promise.all(processPromises);
  res.sendStatus(200);
});

export const handler = serverless(app);
