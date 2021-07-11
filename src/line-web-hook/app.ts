import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { Client, JSONParseError, SignatureValidationFailed, WebhookRequestBody } from '@line/bot-sdk';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import { S3Helper } from '../helpers/s3';
import { UserHelper } from '../helpers/user.ddb';
import { MarketstackService } from '../services/marketstack';
import { LineConfiguration } from './constant';
import { bodylogMiddleware } from './middlewares/line-bodylog';
import { signatureValidationMiddleware } from './middlewares/line-signature-validation';
import { CurvyHousesService } from './services/curvyhouses';

export const app = express();
const lineClient = new Client(LineConfiguration);
const ddbClient = new DynamoDBClient({});

const userHelper = new UserHelper(ddbClient);
const s3Client = new S3Client({});
const s3Helper = new S3Helper(s3Client);
const marketstackService = new MarketstackService(s3Helper);

const curvyHousesService = new CurvyHousesService(lineClient, userHelper, marketstackService);

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
});

app.post('/webhook/line', async(req: Request<any, any, WebhookRequestBody, any, Record<string, any>>, res) => {
  const body = req.body;
  const { events } = body;
  const processPromises = events.map(curvyHousesService.processEvent);
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
