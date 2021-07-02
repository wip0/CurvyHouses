import { QueryOutput } from '@aws-sdk/client-dynamodb';

export interface SqsEvent {
    Records: { body: string }[]
}

export interface FSA<Payload = any> {
    type: string;
    payload: Payload;
}

export interface AggregatedSignal {
    buy: string[];
    sell: string[];
    signal: string;
}

export interface NotifyPayload {
    symbols: string[];
    licenses: string[];
    signals: AggregatedSignal;
    key: string;
}

export interface DynamodbQueryOutput<T> extends Omit<QueryOutput, 'Items'> {
    Items: T[];
}

export interface CloudwatchEvent {
    version: string;
    id: string;
    'detail-type': string;
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: {}
}
