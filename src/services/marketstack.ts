import { S3Client } from '@aws-sdk/client-s3'; // ES Modules import
import * as request from 'request';
import { Response } from 'request';
import { S3Helper } from '../helpers/s3';
import { MarketStack } from '../line-web-hook/constant';
import { EodResponse } from '../line-web-hook/interfaces';
import { retrieveMockData } from '../line-web-hook/utils/mock';

export const MARKETSTACK_API_LIMIT_RATE = 5;

function getS3Key(symbol: string) {
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    // return `temps/${date}/${symbol}`;
    return `temps/MOCK/${symbol}`;
}
export class MarketstackService {
    constructor(private s3Helper: S3Helper) {}
    public async getEodData(symbols: string, limit?: number): Promise<EodResponse> {
        // NOTE: retrieve response from bucket
        const s3Key = getS3Key(symbols);
        const s3Payload = await this.s3Helper.getS3Object(s3Key);
        
        if (s3Payload) {
            return JSON.parse(s3Payload) as EodResponse;
        }

        if (!MarketStack.ENABLE) {
            console.log(`disable market stack api - return mock data for ${symbols}`);
            const payload = await retrieveMockData();
            await this.s3Helper.putS3Object(s3Key, JSON.stringify(payload));
            return payload;
        }

        // NOTE: retrieve response from marketstack api
        return new Promise<EodResponse>((resolve, reject) => {
            request.get({
                url: `${MarketStack.API_ENDPOINT}/v1/eod`,
                qs: {
                    access_key: MarketStack.API_KEY,
                    symbols,
                    limit
                }
            }, async (err: Error, res: Response, body: string) => {
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
                await this.s3Helper.putS3Object(s3Key, body);
                const payload = JSON.parse(body) as EodResponse;
                resolve(payload);
            });
        });
    }
}
