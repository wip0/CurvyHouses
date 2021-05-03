import * as request from 'request';
import { MarketStack } from '../constant';
import { EodResponse } from '../interfaces';
import { retrieveMockData } from '../utils/mock.utils';

export function getEodData(symbols: string) {
    if (!MarketStack.ENABLE) {
        return retrieveMockData();
    }
    return new Promise<EodResponse>((resolve, reject) => {
        request.get({
            url: `${MarketStack.API_ENDPOINT}/v1/eod`,
            qs: {
                access_key: MarketStack.API_KEY,
                symbols
            }
        }, (err: Error, res: any, body: string) => {
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

            console.log(body);
            const payload = JSON.parse(body) as EodResponse;
            resolve(payload);
        });
    });
}
