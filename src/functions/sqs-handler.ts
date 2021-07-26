import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Client } from '@line/bot-sdk';
import { S3Helper } from '../helpers/s3';
import { CURVYHOUSES_QUEUE_URL, SqsHelper } from '../helpers/sqs';
import { UserHelper } from '../helpers/user.ddb';
import { AggregatedSignal, FSA, NotifyPayload, SqsEvent } from '../interfaces';
import { LineConfiguration, MarketStack } from '../line-web-hook/constant';
import { EodData, EodResponse } from '../line-web-hook/interfaces';
import { isError, isUsageLimitReachedError } from '../line-web-hook/utils/utils';
import { MarketStackResponseHeader, MarketstackService, MARKETSTACK_API_LIMIT_RATE } from '../services/marketstack';

const { ma } = require('moving-averages');
const MA_BAR = 200;

class ApiKeyManager {
    constructor(private apiKeys: string[] = []) { }

    hasNext(): boolean {
        return this.apiKeys.length > 0;
    }

    get(): string {
        return this.apiKeys[0];
    }

    getAll(): string[] {
        return this.apiKeys;
    }
    
    remove(apiKey: string): void {
        this.apiKeys = this.apiKeys.filter(key => key !== apiKey);
    }
}


export class SqsHandler {
    private actionMap = new Map<string, Function>();

    constructor(
        private userHelper: UserHelper,
        private sqsHelper: SqsHelper,
        private lineClient: Client,
        private marketstackService: MarketstackService,
    ) {
        this.actionMap.set('NOTIFY', this.processNotifyEvent.bind(this));
    }

    public async handleRequest(event: SqsEvent) {
        for (const record of event.Records) {
            const body = JSON.parse(record.body) as FSA;
            const { payload, type } = body;
            const actionFn = this.actionMap.get(type);
            if (actionFn) {
                await actionFn(payload);
            } else {
                console.log('Invalid type');
            }
        };
    }

    // #region public
    public async processNotifyEvent(payload: NotifyPayload) {
        const { symbols, signals } = payload;
        if (symbols.length === 0) {
            return this.notifySignalToSubscribingUser(signals);
        } 
        return this.prepareAndPushNextNotifyEvent(payload);
    }
    // #endregion public

    // #region private
    private async notifySignalToSubscribingUser(signals: AggregatedSignal) {
        const lineUserQueryOutput = await this.userHelper.getSubscribeUsers();
        if (!lineUserQueryOutput) {
            console.log('No subscribe user');
            return;
        }
        const lineUsers = lineUserQueryOutput.Items;
        const userIds = lineUsers.map((user) => user.userId);

        const buyList = signals.buy.join(', ') || '-';
        const sellList = signals.sell.join(', ') || '-';
        const message = `SMA200 Signal\nBUY\n${buyList}\n\nSELL\n${sellList}`;
    
        const messagePromises = userIds.map(uuid => {
            return this.lineClient.pushMessage(
                uuid,
                {
                    type: 'text',
                    text: message,
                }
            );
        });
        await Promise.all(messagePromises);
    }

    private checkSimpleMovingAverageSignal(data: EodData[], maBar: number): 0 | 1 | -1 {
        const closeData = data.map(item => item.close)
        const closeMas = ma(closeData, maBar);

        const closeToday = closeData[closeData.length - 1];
        const closeYesterday = closeData[closeData.length - 2];

        const closeMaToday = closeMas[closeMas.length - 1];
        const closeMaYesterday = closeMas[closeMas.length - 2];

        let signal: 0 | 1 | -1 = 0;
        if (closeYesterday < closeMaYesterday && closeToday > closeMaToday) { // buy signal
            signal = 1;
        }
        if (closeYesterday > closeMaYesterday && closeToday < closeMaToday) { // sell signal
            signal = -1;
        }
        return signal;
    }

    private async prepareAndPushNextNotifyEvent(payload: NotifyPayload) {
        let { signals, licenses } = payload;
        const { symbols, key } = payload;

        const processList = symbols.splice(0, MARKETSTACK_API_LIMIT_RATE);
        if (licenses.length <= 0) {
            console.log('No license!');
            return;
        }

        const apiKeyManager = new ApiKeyManager(licenses);
        const signalPromises = processList.map(async (symbol) => {
            let eodResult: { payload: EodResponse, headers?: MarketStackResponseHeader} | undefined;
            let eodResponse: EodResponse | undefined;
            do {
                const apiKey = apiKeyManager.get();
                if (!apiKey) {
                    break;
                }
                try {

                    eodResult = await this.marketstackService.getEodData(symbol, apiKey);
                    eodResponse = eodResult.payload;
                    if (isUsageLimitReachedError(eodResponse)) {
                        console.log('MarketStackService Error - usage limit reached', 'apiKey:', apiKey);
                        apiKeyManager.remove(apiKey);
                    } else if (isError(eodResponse)) {
                        console.log('MarketStackService Error', 'apiKey:', apiKey, 'error', JSON.stringify(eodResult));
                        return { symbol, error: JSON.stringify(eodResponse.error) };
                    }
                } catch (err) {
                    console.log('Error while resolve eod data', JSON.stringify(err));
                }
                if (eodResult && eodResult.payload?.error) {
                    break;
                }
                if (!apiKeyManager.hasNext()) {
                    break;
                }
            } while((!eodResult || eodResult.payload?.error || !eodResponse))

            if (!apiKeyManager.hasNext()) {
                console.log('Out of license');
                return { symbol, error: 'Out of license' };
            }
            
            if (!eodResponse || eodResponse.error) {
                return { symbol, error: 'Error while request' + eodResponse?.error };
            }

            const data = eodResponse.data.sort((eod1, eod2) => new Date(eod1.date).getTime() > new Date(eod2.date).getTime() ? 1 : -1);
            const signal = this.checkSimpleMovingAverageSignal(data, MA_BAR);
            return {
                symbol,
                signal,
            };
        });
        
        if (!apiKeyManager.hasNext()) {
            await this.lineClient.pushMessage(
                'U8f5e626be3e9748643a00032c1f1ab71',
                {
                    type: 'text',
                    text: 'Out of license',
                }
            );
        }
        
        const signalObjectResults: { symbol: string, signal?: number, error?: string }[] = await Promise.all(signalPromises);
        const signalObjects = signalObjectResults.filter((obj) => {
            if (obj.error) {
                console.log(`Error while requesting to marketstack for symbol=${obj.symbol} `, obj.error);
                // todo send error message to developer's line
            }
            return !!obj.error;
        }) as { symbol: string, signal: number }[];
        for (const obj of signalObjects) {
            if (obj.signal === 1) { // buy
                signals.buy.push(obj.symbol);
            }
            if (obj.signal === -1) { // sell
                signals.sell.push(obj.symbol);
            }
        }
        const messagePayload: NotifyPayload = {
            symbols,
            licenses: apiKeyManager.getAll(),
            signals,
            key
        };
        const sqsMessage = {
            type: 'NOTIFY',
            payload: messagePayload,
        };
        await this.sqsHelper.sendSqsMessage(CURVYHOUSES_QUEUE_URL, sqsMessage);
    }
    // #endregion private
}

function buildHandler(): SqsHandler {
    const s3Client = new S3Client({});
    const sqsClient = new SQSClient({ region: process.env.AWS_REGION});
    const ddbClient = new DynamoDBClient({});
    const lineClient = new Client(LineConfiguration);

    const sqsHelper = new SqsHelper(sqsClient);
    const s3Helper = new S3Helper(s3Client);
    const userHelper = new UserHelper(ddbClient);

    const marketStackService = new MarketstackService(s3Helper);

    const sqsHandler = new SqsHandler(userHelper, sqsHelper, lineClient, marketStackService);
    return sqsHandler;
}

const sqsHandler = buildHandler();
export const handler = sqsHandler.handleRequest.bind(sqsHandler);
