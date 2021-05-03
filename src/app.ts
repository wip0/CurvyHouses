import { JSONParseError, SignatureValidationFailed } from '@line/bot-sdk';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import { LineReqBody } from './interfaces';
import { bodylogMiddleware } from './middlewares/line-bodylog';
import { signatureValidationMiddleware } from './middlewares/line-signature-validation';
import * as MarketstackService from './services/marketstack.service';
import * as LineService from './services/line.service';
import * as MessageUtils from './utils/message.utils';

const { ma } = require('moving-averages');

const MA_DEFAULT_BAR = 5;

export const app = express();

app.use('/webhook/line', signatureValidationMiddleware); // this middleware should apply first
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/webhook/line', bodylogMiddleware); // this middleware should apply after body parse

app.get('/', function(req, res) {
  const result = {
    data: {
      'message': 'setup from webpack!'
    }
  };
  res.json(result);
})

app.post('/webhook/line', async(req: Request<any, any, LineReqBody, any, Record<string, any>>, res) => {
  const body = req.body;

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
        const eodResponse = await MarketstackService.getEodData(symbol);
        const data = eodResponse.data.sort((eod1, eod2) => new Date(eod1.date).getTime() > new Date(eod2.date).getTime() ? 1 : -1);
        data.splice(0, data.length - MA_DEFAULT_BAR);
        const closeMas = ma(data.map(item => item.close), MA_DEFAULT_BAR);
        const closeMa = closeMas[closeMas.length - 1];
        const { open, close, high, low, volume, adj_open, adj_close, adj_high, adj_low, date } = data[data.length - 1];
        await LineService.reply(replyToken, MessageUtils.buildEodFlexMessage(symbol, new Date(date), open, close, high, low, volume, adj_open, adj_close, adj_high, adj_low, closeMa, command === 'showfull'));
        break;
      default:
        await LineService.reply(replyToken, MessageUtils.buildTextMessage('Invalid command'));
        break;
    }
  });
  await Promise.all(processPromises);
  res.sendStatus(200);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SignatureValidationFailed) {
    console.log('Unauthorized line webhook');
    res.status(401).send(err.signature);
    return;
  } else if (err instanceof JSONParseError) {
    console.log('Error on parsing with line webhook');
    res.status(400).send(err.raw);
    return;
  }
  next(err);
});
