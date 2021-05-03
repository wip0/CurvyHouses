import { EventMessage, FollowEvent, MessageEvent, TextEventMessage, UnfollowEvent, WebhookEvent } from '@line/bot-sdk';

export function isFollowEvent(event: WebhookEvent): event is FollowEvent {
    return event.type === 'follow';
}

export function isMessageEvent(event: WebhookEvent): event is MessageEvent {
    return event.type === 'message';
}

export function isTextEventMessage(message: EventMessage): message is TextEventMessage {
    return 'text' in message;
}

export function isUnfollowEvent(event: WebhookEvent): event is UnfollowEvent {
    return event.type === 'unfollow';
}