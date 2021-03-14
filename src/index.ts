import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as serverless from 'serverless-http';
import { LineReqBody } from './interfaces';
import * as DataService from './services/data.service';
import * as LineService from './services/line.service';
import * as MessageUtils from './utils/message.utils';
import * as Utils from './utils/utils';

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
  LineService.verifySignature(req);
  if (!Utils.validateLinePayload(body)) {
    console.log('Invalid payload');
    throw new Error('Invalid payload');
  }
  Utils.logPayloadDebug(body);

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
      case 'showfull':
        const symbol = params[0];
        const eodResponse = await DataService.getEodData(symbol);
        const data = eodResponse?.data[0];
        const { open, close, high, low, volume, adj_open, adj_close, adj_high, adj_low } = data;
        await LineService.reply(replyToken, MessageUtils.buildEodFlexMessage(symbol, open, close, high, low, volume, adj_open, adj_close, adj_high, adj_low, command === 'showfull'));
        break;
      default:
        await LineService.reply(replyToken, MessageUtils.buildTextMessage('Invalid command'));
        break;
    }
  });
  await Promise.all(processPromises);
  res.sendStatus(200);
});

export const handler = serverless(app);
