import { AttributeValue, DynamoDBClient, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamodbQueryOutput } from '../interfaces';

export interface LineUser {
    userId: string;
    displayName: string;
    isFollow: boolean;
    isSubscribed: boolean;
}

export class UserHelper {
    constructor(private client: DynamoDBClient) {}

    public static convertLineUserToRecord(user: LineUser): { [key: string]: AttributeValue } {
        const record = {
            pk: 'user',
            sk: user.userId,
            displayName: user.displayName,
            isFollow: user.isFollow,
            isSubscribed: String(user.isSubscribed),
        };
        return marshall(record);
    }
    
    public static convertRecordToLineUser(record: { [key: string]: AttributeValue }): LineUser {
        const data = unmarshall(record);
        return {
            userId: data.sk,
            displayName: data.displayName,
            isFollow: Boolean(data.isFollow),
            isSubscribed: Boolean(data.isSubscribed),
        };
    }

    public async getSubscribeUsers(params?: {
        limit: number,
        lastEvaluatedKey?: { [key: string]: AttributeValue }
    }): Promise<DynamodbQueryOutput<LineUser> | undefined> {
        const attributeValues = {
            ':pk': 'user',
            ':isSubscribed': 'true'
        };
        const queryParams: QueryCommandInput = {
            TableName: process.env.CURVYHOUSES_TABLE,
            IndexName: 'subscribe-index',
            KeyConditionExpression: '#pk = :pk AND #isSubscribed = :isSubscribed',
            ExpressionAttributeNames: {
                '#pk': 'pk',
                '#isSubscribed': 'isSubscribed'
            },
            ExpressionAttributeValues: marshall(attributeValues),
            ExclusiveStartKey: params?.lastEvaluatedKey,
            Limit: params?.limit,
        };
        const data = await this.client.send(new QueryCommand(queryParams));
        if (!data.Items) {
            console.log('No people to push data');
            return;
        }
        const { Items: items, ...output } = data;
        return {
            ...output,
            Items: data.Items.map(UserHelper.convertRecordToLineUser),
        };
    }
}
