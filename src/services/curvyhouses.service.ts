import { Client, FollowEvent, MessageEvent, UnfollowEvent, WebhookEvent } from '@line/bot-sdk';
import { LineConfiguration } from '../constant';
import * as LineUtils from '../utils/line.utils';
import * as MessageUtils from '../utils/message.utils';
import * as MarketstackService from './marketstack.service';

const client = new Client(LineConfiguration);
const { ma } = require('moving-averages');
const MA_DEFAULT_BAR = 5;

const actionMap = new Map<string, (command: string, params: any[], replyToken: string) => Promise<void>>();
actionMap.set('show', replySymbolDataHandler);
actionMap.set('showfull', replySymbolDataHandler);
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
    // TODO: handle follow event
}

async function processUnfollowEvent(event: UnfollowEvent): Promise<void> {
    // TODO: handle unfollow event
}

async function processsMessageEvent(event: MessageEvent): Promise<void> {
    const { replyToken, message } = event;
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
    await actionHandler(action, params, replyToken);
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
