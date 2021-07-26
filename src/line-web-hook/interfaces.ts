export interface Pagination {
    limit: number;
    offset: number;
    count: number;
    total: number;
}

export interface EodData {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adj_high?: number | null;
    adj_low?: number | null;
    adj_open?: number | null;
    adj_close?: number | null;
    adj_volume?: number | null;
    split_factor?: number | null;
    symbol: string;
    exchange: string;
    date: string;
}

export interface EodResponse {
    pagination: Pagination;
    data: EodData[];
    error?: any;
}

export interface PolygonDailyOpenCloseResponse {
    status: 'OK' | 'NOT_FOUND';
    // from: string;
    // symbol: string;
    // open: number;
    // high: number;
    // close: number;
    // volumne: number;
    // afterHours: number;
    // preMarket: number;
}

export interface LineReqEvent {
    message: {
        text: string;
    };
    replyToken: string;
}

export interface LineReqBody {
    events: LineReqEvent[];
}

export type SeperatorMargin = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
