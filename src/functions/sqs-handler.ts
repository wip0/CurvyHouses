import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Client } from '@line/bot-sdk';
import { CURVYHOUSES_QUEUE_URL, SqsHelper } from '../helpers/sqs.helper';
import { UserHelper } from '../helpers/users.ddb.helper';
import { AggregatedSignal, FSA, NotifyPayload, SqsEvent } from '../interfaces';
import { LineConfiguration } from '../line-web-hook/constant';
import * as MarketstackService from '../line-web-hook/services/marketstack.service';
import { MARKETSTACK_API_LIMIT_RATE } from '../line-web-hook/services/marketstack.service';

const { ma } = require('moving-averages');
const MA_BAR = 200;

export class SqsHandler {
    private actionMap = new Map<string, Function>();

    constructor(
        private userHelper: UserHelper,
        private sqsHelper: SqsHelper,
        private lineClient: Client,
    ) {
        this.actionMap.set('NOTIFY', this.processNotifyEvent.bind(this));
    }

    public async handleRequest(event: SqsEvent) {
        for (const record of event.Records) {
            const body = JSON.parse(record.body) as FSA;
            console.log(JSON.stringify(body, null, 2));
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
        const message = `BUY\n${buyList}\n\nSELL\n${sellList}`;
    
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

    private async prepareAndPushNextNotifyEvent(payload: NotifyPayload) {
        let { signals, licenses } = payload;
        const { symbols, key } = payload;

        const processList = symbols.splice(0, MARKETSTACK_API_LIMIT_RATE);
        const signalPromises = processList.map(async (symbol) => {
            const eodResponse = await MarketstackService.getEodData(symbol, MA_BAR + 1);
            const data = eodResponse.data.sort((eod1, eod2) => new Date(eod1.date).getTime() > new Date(eod2.date).getTime() ? 1 : -1);
            const closeData = data.map(item => item.close)
            const closeMas = ma(closeData, MA_BAR);
    
            const closeToday = closeData[closeData.length - 1];
            const closeYesterday = closeData[closeData.length - 2];
    
            const closeMaToday = closeMas[closeMas.length - 1];
            const closeMaYesterday = closeMas[closeMas.length - 2];
    
            let signal = 0;
            if (closeYesterday < closeMaYesterday && closeToday > closeMaToday) { // buy signal
                signal = 1;
            }
            if (closeYesterday > closeMaYesterday && closeToday < closeMaToday) { // sell signal
                signal = -1;
            }
            return {
                symbol,
                signal,
            };
        });
        const signalObjects: { symbol: string, signal: number }[] = await Promise.all(signalPromises);
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
            licenses,
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
    const sqsClient = new SQSClient({ region: process.env.AWS_REGION});
    const ddbClient = new DynamoDBClient({});
    const lineClient = new Client(LineConfiguration);

    const sqsHelper = new SqsHelper(sqsClient);
    const userHelper = new UserHelper(ddbClient);

    const sqsHandler = new SqsHandler(userHelper, sqsHelper, lineClient);
    return sqsHandler;
}

const sqsHandler = buildHandler();
export const handler = sqsHandler.handleRequest.bind(sqsHandler);
