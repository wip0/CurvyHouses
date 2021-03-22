import * as request from 'request';
import { MarketStock } from '../constant';
import { EodResponse } from '../interfaces';


export function getEodData(symbols: string) {
    // return retrieveRealData(symbols);
    return retrieveMockData(symbols);
}

export async function retrieveRealData(symbols: string): Promise<EodResponse> {
    return new Promise<EodResponse>((resolve, reject) => {
        request.get({
            url: `${MarketStock.API_ENDPOINT}/v1/eod`,
            qs: {
                access_key: MarketStock.API_KEY,
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
            const payload = JSON.parse(body) as EodResponse;
            if (err) {
                console.log(err);
            }
            resolve(payload);
        });
    })
}

export async function retrieveMockData(symbols: string): Promise<EodResponse> {
    return {
        pagination: {
            limit: 100,
            offset: 0,
            count: 15,
            total: 15
        },
        data: [
            {
                open: 119.9,
                high: 121.43,
                low: 119.675,
                close: 119.99,
                volume: 185023200.0,
                adj_high: 121.43,
                adj_low: 119.675,
                adj_close: 119.99,
                adj_open: 119.9,
                adj_volume: 185549522.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-19T00:00:00+0000'
            },
            {
                open: 122.88,
                high: 123.18,
                low: 120.33,
                close: 120.53,
                volume: 118907153.0,
                adj_high: 123.18,
                adj_low: 120.32,
                adj_close: 120.53,
                adj_open: 122.88,
                adj_volume: 121469755.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-18T00:00:00+0000'
            },
            {
                open: 124.05,
                high: 125.8599,
                low: 122.34,
                close: 124.76,
                volume: 111932636.0,
                adj_high: 125.8599,
                adj_low: 122.336,
                adj_close: 124.76,
                adj_open: 124.05,
                adj_volume: 111932636.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-17T00:00:00+0000'
            },
            {
                open: 125.7,
                high: 127.22,
                low: 124.715,
                close: 125.57,
                volume: 115227936.0,
                adj_high: 127.22,
                adj_low: 124.715,
                adj_close: 125.57,
                adj_open: 125.7,
                adj_volume: 115227936.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-16T00:00:00+0000'
            },
            {
                open: 121.41,
                high: 124.0,
                low: 120.43,
                close: 123.99,
                volume: 92590555.0,
                adj_high: 124.0,
                adj_low: 120.42,
                adj_close: 123.99,
                adj_open: 121.41,
                adj_volume: 92590555.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-15T00:00:00+0000'
            },
            {
                open: 120.4,
                high: 121.17,
                low: 119.16,
                close: 121.03,
                volume: 87963400.0,
                adj_high: 121.17,
                adj_low: 119.16,
                adj_close: 121.03,
                adj_open: 120.4,
                adj_volume: 88105050.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-12T00:00:00+0000'
            },
            {
                open: 122.54,
                high: 123.21,
                low: 121.26,
                close: 121.96,
                volume: 102753600.0,
                adj_high: 123.21,
                adj_low: 121.26,
                adj_close: 121.96,
                adj_open: 122.54,
                adj_volume: 103026514.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-11T00:00:00+0000'
            },
            {
                open: 121.69,
                high: 122.17,
                low: 119.45,
                close: 119.98,
                volume: 111760400.0,
                adj_high: 122.17,
                adj_low: 119.45,
                adj_close: 119.98,
                adj_open: 121.69,
                adj_volume: 111943326.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-10T00:00:00+0000'
            },
            {
                open: 119.03,
                high: 122.06,
                low: 118.79,
                close: 121.09,
                volume: 129159600.0,
                adj_high: 122.06,
                adj_low: 118.79,
                adj_close: 121.09,
                adj_open: 119.03,
                adj_volume: 129525780.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-09T00:00:00+0000'
            },
            {
                open: 120.93,
                high: 121.0,
                low: 116.21,
                close: 116.36,
                volume: 153918600.0,
                adj_high: 121.0,
                adj_low: 116.21,
                adj_close: 116.36,
                adj_open: 120.93,
                adj_volume: 154376610.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-08T00:00:00+0000'
            },
            {
                open: 120.98,
                high: 121.935,
                low: 117.57,
                close: 121.42,
                volume: 153590400.0,
                adj_high: 121.935,
                adj_low: 117.57,
                adj_close: 121.42,
                adj_open: 120.98,
                adj_volume: 153766601.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-05T00:00:00+0000'
            },
            {
                open: 121.75,
                high: 123.6,
                low: 118.62,
                close: 120.13,
                volume: 164527934.0,
                adj_high: 123.6,
                adj_low: 118.62,
                adj_close: 120.13,
                adj_open: 121.75,
                adj_volume: 178154975.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-04T00:00:00+0000'
            },
            {
                open: 124.81,
                high: 125.71,
                low: 121.84,
                close: 122.06,
                volume: 112965897.0,
                adj_high: 125.71,
                adj_low: 121.84,
                adj_close: 122.06,
                adj_open: 124.81,
                adj_volume: 112966340.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-03T00:00:00+0000'
            },
            {
                open: 128.41,
                high: 128.72,
                low: 125.015,
                close: 125.12,
                volume: 102260945.0,
                adj_high: 128.72,
                adj_low: 125.01,
                adj_close: 125.12,
                adj_open: 128.41,
                adj_volume: 102260945.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-02T00:00:00+0000'
            },
            {
                open: 123.75,
                high: 127.93,
                low: 122.79,
                close: 127.79,
                volume: 116307892.0,
                adj_high: 127.93,
                adj_low: 122.79,
                adj_close: 127.79,
                adj_open: 123.75,
                adj_volume: 116307892.0,
                symbol: 'AAPL',
                exchange: 'XNAS',
                date: '2021-03-01T00:00:00+0000'
            }
        ]
    }
}
