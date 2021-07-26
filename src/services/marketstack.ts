import * as request from 'request';
import { Response } from 'request';
import { S3Helper } from '../helpers/s3';
import { MarketStack } from '../line-web-hook/constant';
import { EodResponse } from '../line-web-hook/interfaces';
import { retrieveMockData } from '../line-web-hook/utils/mock';

export const MARKETSTACK_API_LIMIT_RATE = 5;

export interface MarketStackResponseHeader {
    'x-apilayer-transaction-id': string;
    'x-increment-usage': string;
    'x-quota-limit': string;
    'x-ratelimit-limit-second': string;
    'x-ratelimit-remaining-second': string;
    'x-ratelimit-reset-second': string;
    'x-request-time': string;
}

function getS3Key(symbol: string) {
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    return `temps/${date}/${symbol}`;
    // return `temps/MOCK/${symbol}`;
}
export class MarketstackService {
    constructor(private s3Helper: S3Helper) {}
    public async getEodData(symbols: string, accessKey: string, limit?: number): Promise<{ payload: EodResponse, headers?: MarketStackResponseHeader}> {
        // NOTE: retrieve response from bucket
        const s3Key = getS3Key(symbols);
        const s3Payload = await this.s3Helper.getS3Object(s3Key);
        
        if (s3Payload) {
            const result = {
                payload: JSON.parse(s3Payload) as EodResponse,
            };
            return result;
        }

        if (!MarketStack.ENABLE) {
            console.log(`disable market stack api - return mock data for ${symbols}`);
            const payload = await retrieveMockData();
            await this.s3Helper.putS3Object(s3Key, JSON.stringify(payload));
            const result = {
                payload
            };
            return result;
        }

        // NOTE: retrieve response from marketstack api
        return new Promise<{ payload: EodResponse, headers: MarketStackResponseHeader}>((resolve, reject) => {
            request.get({
                url: `${MarketStack.API_ENDPOINT}/v1/eod`,
                qs: {
                    access_key: accessKey,
                    symbols,
                    limit
                }
            }, async (err: Error, res: Response, body: string) => {
                const headers = res.headers as unknown as MarketStackResponseHeader;
                
                /*
                    # 422 Unprocessable Entity - On passing invalid symbol - This also be count in API usage
                    {
                        error: {
                            code: 'no_valid_symbols_provided',
                            message: 'At least one valid symbol must be provided'
                        }
                    }
                */
                /*
                    # 401 Unauthorized - On passing invalid token
                    {
                        error: {
                            code: 'invalid_access_key',
                            message: 'You have not supplied a valid API Access Key.'
                        }
                    }
                */
                if (err) {
                    console.log(err);
                    reject(err);
                }

                // NOTE: need to check response header
                const payload = JSON.parse(body) as EodResponse;
                if (!payload.error) {
                    await this.s3Helper.putS3Object(s3Key, body);
                }
                const result = {
                    payload,
                    headers
                };
                resolve(result);
            });
        });
    }
}
