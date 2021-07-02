import { marshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { Client, FollowEvent, MessageEvent, UnfollowEvent, WebhookEvent } from '@line/bot-sdk';
import { LineConfiguration } from '../constant';
import * as LineUtils from '../utils/line.utils';
import * as MessageUtils from '../utils/message.utils';
import * as MarketstackService from './marketstack.service';

const ddbClient = new DynamoDBClient({});

const client = new Client(LineConfiguration);
const { ma } = require('moving-averages');
const MA_DEFAULT_BAR = 5;

const actionMap = new Map<string, (command: string, params: any[], replyToken: string, userId?: string) => Promise<void>>();
actionMap.set('show', replySymbolDataHandler);
actionMap.set('showfull', replySymbolDataHandler);
actionMap.set('subscribe', replySubscriptionSetHandler);
actionMap.set('-', logNonCommandHandler);


export async function processEvent(event: WebhookEvent): Promise<void> {
    if (LineUtils.isMessageEvent(event)) {
        return processsMessageEvent(event);
    }
    if (LineUtils.isFollowEvent(event)) {
        return processFollowEvent(event);
    }
    if (LineUtils.isUnfollowEvent(event)) {
        return processUnfollowEvent(event);
    }
}

async function processFollowEvent(event: FollowEvent): Promise<void> {
    const { source } = event;
    const { type, userId } = source;
    if (type !== 'user' || !userId) {
        console.log('Skip non-user following');
        return;
    }
    const userProfile = await client.getProfile(userId);
    const { displayName } = userProfile;
    const item = {
        pk: 'user',
        sk: userId,
        userId,
        displayName,
        isFollow: true,
    };
    const params = {
        TableName: process.env.CURVYHOUSES_TABLE,
        Item: marshall(item),
    };
    const data = await ddbClient.send(new PutItemCommand(params));
    console.log('follow event - update data', JSON.stringify(data, null, 2));
}

async function processUnfollowEvent(event: UnfollowEvent): Promise<void> {
    const { source } = event;
    const { type, userId } = source;
    if (type !== 'user' || !userId) {
        console.log('Skip non-user unfollowing');
        return;
    }
    const key = {
        pk: 'user',
        sk: userId,
    };
    const expressionAttributeValues = {
        ':isFollow': false,
    }
    const updateItemParams = {
        TableName: process.env.CURVYHOUSES_TABLE,
        Key: marshall(key),
        UpdateExpression: 'SET #isFollow = :isFollow',
        ExpressionAttributeNames: {
            '#isFollow': 'isFollow'
        },
        ExpressionAttributeValues: marshall(expressionAttributeValues),
    };
    const data = await ddbClient.send(new UpdateItemCommand(updateItemParams));
    console.log('unfollow event - update data', JSON.stringify(data, null, 2));
}

async function processsMessageEvent(event: MessageEvent): Promise<void> {
    const { replyToken, message, source } = event;
    const { userId } = source;
    if (!LineUtils.isTextEventMessage(message)) {
        return;
    }
    const { action, params } = getActionPayload(message.text);

    const actionHandler = actionMap.get(action);
    if (!actionHandler) {
        console.log('Invalid command');
        await client.replyMessage(replyToken, MessageUtils.buildTextMessage('Invalid command'));
        return;
    }
    await actionHandler(action, params, replyToken, userId);
}

function getActionPayload(message: string): { action: string, params: any[] } {
    if (!message.startsWith('#')) {
      return { action: '-', params: [] };
    }
    const [actionText, ...params] = message.split(' ');
    const action = actionText.substr(1).toLowerCase(); // cut off '#'
    return { action, params };
}

async function logNonCommandHandler(command: string, params: any[], replyToken: string): Promise<void> {
    console.log('Skip non-command message');
    return;
}

async function replySymbolDataHandler(command: string, params: any[], replyToken: string): Promise<void> {
    const symbol = params[0];
    const eodResponse = await MarketstackService.getEodData(symbol);
    const data = eodResponse.data.sort((eod1, eod2) => new Date(eod1.date).getTime() > new Date(eod2.date).getTime() ? 1 : -1);
    data.splice(0, data.length - MA_DEFAULT_BAR);
    const closeMas = ma(data.map(item => item.close), MA_DEFAULT_BAR);
    const closeMa = closeMas[closeMas.length - 1];
    const { open, close, high, low, volume, adj_open, adj_close, adj_high, adj_low, date } = data[data.length - 1];
    const replyMessage = MessageUtils.buildEodFlexMessage(symbol, new Date(date), open, close, high, low, volume, adj_open, adj_close, adj_high, adj_low, closeMa, command === 'showfull');
    await client.replyMessage(replyToken, replyMessage);
}


/*
    #SUBSCRIBE ON|OFF
*/
async function replySubscriptionSetHandler(command: string, params: any, replyToken: string, userId?: string): Promise<void> {
    if (!userId) {
        console.log('No user id');
        return;
    }
    const notifyFlag = params[0].toUpperCase();
    if (!['ON', 'OFF'].includes(notifyFlag)) {
        await client.replyMessage(replyToken, MessageUtils.buildTextMessage('Invalid flag - #SUBSCRIBE [ON|OFF]'));
        return;
    }
    const isSubscribed = notifyFlag === 'ON';
    const key = {
        pk: 'user',
        sk: userId,
    };
    const expressionAttributeValues = {
        ':isSubscribed': String(isSubscribed),
    }
    const updateItemParams = {
        TableName: process.env.CURVYHOUSES_TABLE,
        Key: marshall(key),
        UpdateExpression: 'SET #isSubscribed = :isSubscribed',
        ExpressionAttributeNames: {
            '#isSubscribed': 'isSubscribed'
        },
        ExpressionAttributeValues: marshall(expressionAttributeValues),
    };

    const data = await ddbClient.send(new UpdateItemCommand(updateItemParams));
    await client.replyMessage(replyToken, MessageUtils.buildTextMessage(`Turn ${notifyFlag.toLowerCase()} subscription`));
}
