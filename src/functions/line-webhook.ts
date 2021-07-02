import * as serverless from 'serverless-http';
import { app } from '../line-web-hook/app';

export const handler = serverless(app);
