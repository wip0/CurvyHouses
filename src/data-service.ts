import * as request from 'request';

const MarketStock = {
    API_ENDPOINT: process.env.MARKETSTOCK_ENDPOINT as string,
    API_KEY: process.env.MARKETSTOCK_API_KEY as string,
};

interface Pagination {
    limit: number;
    offset: number;
    count: number;
    total: number;
}

interface EodData {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adj_high: number;
    adj_low: number;
    adj_open: number;
    adj_close: number;
    adj_volume: number;
    symbol: string;
    exchange: string;
    date: string;
}

interface EodResponse {
    pagination: Pagination;
    data: EodData[]
}

export function getEodData(symbols: string) {
    // return retrieveRealData(symbols);
    return retrieveMockData(symbols);
}

export async function retrieveRealData(symbols: string): Promise<EodResponse> {
    return new Promise<EodResponse>((resolve, reject) => {
        request.get({
            url: `${MarketStock.API_ENDPOINT}/v1/eod/latest`,
            qs: {
                access_key: MarketStock.API_KEY,
                symbols
            }
        }, (err: Error, res: any, body: string) => {
            /*
                # 422 Unprocessable Entity - On passing invalid symbol - This also be count in API usage
                {
                    "error": {
                        "code": "no_valid_symbols_provided",
                        "message": "At least one valid symbol must be provided"
                    }
                }
            */
            /*
                # 401 Unauthorized - On passing invalid token
                {
                    "error": {
                        "code": "invalid_access_key",
                        "message": "You have not supplied a valid API Access Key."
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
            count: 1,
            total: 0
        },
        data: [
            {
                date: '2019-02-01T00:00:00+0000',
                symbol: 'AAPL',
                exchange: 'XNAS',
                open: 166.96,
                high: 168.98,
                low: 165.93,
                close: 166.52,
                volume: 32668138.0,
                adj_open: 164.0861621594,
                adj_high: 166.0713924395,
                adj_low: 163.073891274,
                adj_close: 163.6537357617,
                adj_volume: 32668138.0
            },
        ]
    }
}
