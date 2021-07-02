import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export interface LineUser {
    userId: string;
    displayName: string;
    isFollow: boolean;
    isSubscribed: boolean;
}

export function convertRecordToLineUser(record: { [key: string]: AttributeValue }): LineUser {
    const data = unmarshall(record);
    return {
        userId: data.sk,
        displayName: data.displayName,
        isFollow: Boolean(data.isFollow),
        isSubscribed: Boolean(data.isSubscribed),
    };
}

export function convertLineUserToRecord(user: LineUser): { [key: string]: AttributeValue } {
    const record = {
        pk: 'user',
        sk: user.userId,
        displayName: user.displayName,
        isFollow: user.isFollow,
        isSubscribed: String(user.isSubscribed),
    };
    return marshall(record);
}
