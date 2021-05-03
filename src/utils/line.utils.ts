import { EventMessage, MessageEvent, TextEventMessage, WebhookEvent } from '@line/bot-sdk';

export function isMessageEvent(event: WebhookEvent): event is MessageEvent {
    return event.type === 'message';
}

export function isTextEventMessage(message: EventMessage): message is TextEventMessage {
    return 'text' in message;
}
