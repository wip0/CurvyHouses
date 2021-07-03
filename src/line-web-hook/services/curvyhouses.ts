import { Client, FollowEvent, MessageEvent, UnfollowEvent, WebhookEvent } from '@line/bot-sdk';
import { UserHelper } from '../../helpers/user.ddb';
import * as MarketstackService from '../../services/marketstack';
import * as LineUtils from '../utils/line';
import * as MessageUtils from '../utils/message';

const { ma } = require('moving-averages');
const MA_DEFAULT_BAR = 5;

export type ActionFunction = (command: string, params: any[], replyToken: string, userId?: string) => Promise<void>;

export class CurvyHousesService {
    private messageActionMap = new Map<string, ActionFunction>();

    constructor(
        private lineClient: Client,
        private userHelper: UserHelper,
    ) {
        this.processEvent = this.processEvent.bind(this);
        this.doShowSymbolDataCommand = this.doShowSymbolDataCommand.bind(this);
        this.doShowSymbolDataCommand = this.doShowSymbolDataCommand.bind(this);
        this.doSetSubscriptionCommand = this.doSetSubscriptionCommand.bind(this);
        this.logNonCommandHandler = this.logNonCommandHandler.bind(this);

        this.messageActionMap.set('show', this.doShowSymbolDataCommand);
        this.messageActionMap.set('showfull', this.doShowSymbolDataCommand);
        this.messageActionMap.set('subscribe', this.doSetSubscriptionCommand);
        this.messageActionMap.set('-', this.logNonCommandHandler);
    }

    public processEvent(event: WebhookEvent): Promise<void> {
        if (LineUtils.isMessageEvent(event)) {
            return this.processsMessageEvent(event);
        }
        if (LineUtils.isFollowEvent(event)) {
            return this.processFollowEvent(event);
        }
        if (LineUtils.isUnfollowEvent(event)) {
            return this.processUnfollowEvent(event);
        }
        return Promise.resolve();
    }

    private async processFollowEvent(event: FollowEvent): Promise<void> {
        const { source } = event;
        const { type, userId } = source;
        if (type !== 'user' || !userId) {
            console.log('Skip non-user following');
            return;
        }
        const userProfile = await this.lineClient.getProfile(userId);
        const { displayName } = userProfile;
        const user = await this.userHelper.createUser(userId, displayName);
        console.log('follow event - update data', JSON.stringify(user, null, 2));
    }
    
    private async processUnfollowEvent(event: UnfollowEvent): Promise<void> {
        const { source } = event;
        const { type, userId } = source;
        if (type !== 'user' || !userId) {
            console.log('Skip non-user unfollowing');
            return;
        }
        const user = await this.userHelper.setFollowFlagToUser(userId, false);
        console.log('unfollow event - update user', JSON.stringify(user, null, 2));
    }
    
    private async processsMessageEvent(event: MessageEvent): Promise<void> {
        const { replyToken, message, source } = event;
        const { userId } = source;
        if (!LineUtils.isTextEventMessage(message)) {
            return;
        }
        const { action, params } = this.getActionPayload(message.text);
    
        const actionHandler = this.messageActionMap.get(action);
        if (!actionHandler) {
            console.log('Invalid command');
            await this.lineClient.replyMessage(replyToken, MessageUtils.buildTextMessage('Invalid command'));
            return;
        }
        await actionHandler(action, params, replyToken, userId);
    }



    private  getActionPayload(message: string): { action: string, params: any[] } {
        if (!message.startsWith('#')) {
          return { action: '-', params: [] };
        }
        const [actionText, ...params] = message.split(' ');
        const action = actionText.substr(1).toLowerCase(); // cut off '#'
        return { action, params };
    }
    
    private async logNonCommandHandler(command: string, params: any[], replyToken: string): Promise<void> {
        console.log('Skip non-command message');
        return;
    }

    /*
        COMMAND:
            #SHOW [SYMBOL]
            #SHOWFULL [SYMBOL]
    */
    private async doShowSymbolDataCommand(command: string, params: any[], replyToken: string): Promise<void> {
        const symbol = params[0];
        const eodResponse = await MarketstackService.getEodData(symbol);
        const data = eodResponse.data.sort((eod1, eod2) => new Date(eod1.date).getTime() > new Date(eod2.date).getTime() ? 1 : -1);
        data.splice(0, data.length - MA_DEFAULT_BAR);
        const closeMas = ma(data.map(item => item.close), MA_DEFAULT_BAR);
        const closeMa = closeMas[closeMas.length - 1];
        const { open, close, high, low, volume, adj_open, adj_close, adj_high, adj_low, date } = data[data.length - 1];
        const replyMessage = MessageUtils.buildEodFlexMessage(symbol, new Date(date), open, close, high, low, volume, adj_open, adj_close, adj_high, adj_low, closeMa, command === 'showfull');
        await this.lineClient.replyMessage(replyToken, replyMessage);
    }

    /*
        COMMAND:
            #SUBSCRIBE [FLAG]
        ARGS:
            [FLAG] - ON|OFF
    */
    private async doSetSubscriptionCommand(command: string, params: any, replyToken: string, userId?: string): Promise<void> {
        if (!userId) {
            console.log('No user id');
            return;
        }
        const notifyFlag = params[0].toUpperCase();
        if (!['ON', 'OFF'].includes(notifyFlag)) {
            await this.lineClient.replyMessage(replyToken, MessageUtils.buildTextMessage('Invalid flag - #SUBSCRIBE [ON|OFF]'));
            return;
        }
        const isSubscribed = notifyFlag === 'ON';
        const user = await this.userHelper.setSubscribeFlagToUser(userId, isSubscribed);
        await this.lineClient.replyMessage(replyToken, MessageUtils.buildTextMessage(`Turn ${notifyFlag.toLowerCase()} subscription`));
    }
}
