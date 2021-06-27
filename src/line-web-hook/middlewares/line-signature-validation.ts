import { middleware } from '@line/bot-sdk';
import { LineConfiguration } from '../constant';

export const signatureValidationMiddleware = middleware(LineConfiguration);
