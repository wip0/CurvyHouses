import { JSONParseError, SignatureValidationFailed, WebhookRequestBody } from '@line/bot-sdk';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import { bodylogMiddleware } from './middlewares/line-bodylog';
import { signatureValidationMiddleware } from './middlewares/line-signature-validation';
import * as CurvyhousesService from './services/curvyhouses';

export const app = express();

app.use('/webhook/line', signatureValidationMiddleware); // this middleware should apply first
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/webhook/line', bodylogMiddleware); // this middleware should apply after body parse

app.get('/', function(req, res) {
  const result = {
    data: {
      'message': 'setup from webpack!'
    },
  };
  res.json(result);
})

app.post('/webhook/line', async(req: Request<any, any, WebhookRequestBody, any, Record<string, any>>, res) => {
  const body = req.body;
  const { events } = body;
  const processPromises = events.map(CurvyhousesService.processEvent);
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
