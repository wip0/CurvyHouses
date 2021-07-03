import { SendMessageBatchCommand, SendMessageBatchCommandInput, SendMessageBatchCommandOutput, SendMessageBatchRequestEntry, SendMessageCommand, SendMessageCommandInput, SendMessageCommandOutput, SQSClient } from '@aws-sdk/client-sqs';
import { chunkItems } from '../utils';

export const CURVYHOUSES_QUEUE_URL = process.env.CURVYHOUSES_QUEUE_URL ?? '';
const MAX_SQS_BATCH_SIZE = 10;

export class SqsHelper {
    constructor(private client: SQSClient) {}

    public async sendMessageMultiBatch(queueUrl: string, entries: SendMessageBatchRequestEntry[]): Promise<SendMessageBatchCommandOutput[]> {
        const snsBatchEntriesChunk = chunkItems(entries, MAX_SQS_BATCH_SIZE);
        const result = [];
        for (const entries of snsBatchEntriesChunk) {
            const sendMessageBatchCommandInput: SendMessageBatchCommandInput = {
                Entries: entries,
                QueueUrl: queueUrl,
            };
            const command = new SendMessageBatchCommand(sendMessageBatchCommandInput);
            result.push(await this.client.send(command));
        }
        return result;
    }
    
    public sendSqsMessage(queueUrl: string, body: object | string, groupId?: string, deduplicationId?: string): Promise<SendMessageCommandOutput> {
        const input: SendMessageCommandInput = {
            QueueUrl: queueUrl,
            MessageBody: typeof body === 'string' ? body : JSON.stringify(body),
            MessageGroupId: groupId,
            MessageDeduplicationId: deduplicationId,
        };
        const command = new SendMessageCommand(input)
        return this.client.send(command);
    }
}
