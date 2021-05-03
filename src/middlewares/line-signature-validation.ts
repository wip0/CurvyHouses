import { middleware } from '@line/bot-sdk';
import { LineChannel } from '../constant';

const lineMiddlewareConfig = {
    channelAccessToken: LineChannel.TOKEN,
    channelSecret: LineChannel.SECRET,
  };

export const signatureValidationMiddleware = middleware(lineMiddlewareConfig);
