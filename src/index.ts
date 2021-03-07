import * as express from 'express';
import * as bodyParser from 'body-parser';
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

export const handler = serverless(app);
