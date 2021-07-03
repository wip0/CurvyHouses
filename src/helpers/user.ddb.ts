import { AttributeValue, DynamoDBClient, PutItemCommand, QueryCommand, QueryCommandInput, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
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

    public async createUser(userId: string, displayName: string): Promise<LineUser | undefined> {
        const user: LineUser = {
            userId: userId,
            displayName: displayName,
            isFollow: true,
            isSubscribed: false,
        };
        const params = {
            TableName: process.env.CURVYHOUSES_TABLE,
            Item: UserHelper.convertLineUserToRecord(user),
        };
        const data = await this.client.send(new PutItemCommand(params));
        if (!data.Attributes) {
            return undefined;
        }
        return UserHelper.convertRecordToLineUser(data.Attributes);
    }

    public async setFollowFlagToUser(userId: string, isFollow: boolean): Promise<LineUser | undefined> {
        const key = {
            pk: 'user',
            sk: userId,
        };
        const expressionAttributeValues = {
            ':isFollow': isFollow,
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
        const data = await this.client.send(new UpdateItemCommand(updateItemParams));
        if (!data.Attributes) {
            return undefined;
        }
        return UserHelper.convertRecordToLineUser(data.Attributes);
    }

    public async setSubscribeFlagToUser(userId: string, isSubscribe: boolean): Promise<LineUser | undefined> {
        const key = {
            pk: 'user',
            sk: userId,
        };
        const expressionAttributeValues = {
            ':isSubscribed': String(isSubscribe),
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
        const data = await this.client.send(new UpdateItemCommand(updateItemParams));
        if (!data.Attributes) {
            return undefined;
        }
        return UserHelper.convertRecordToLineUser(data.Attributes);

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
