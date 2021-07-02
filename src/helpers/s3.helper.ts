import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

function streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
};

export class S3Helper {
    constructor(private client: S3Client) {}
    
    public async getS3Object(key: string): Promise<string | undefined> {
        const input = {
            Bucket: process.env.CURVYHOUSES_BUCKET,
            Key: key,
        };
        const command = new GetObjectCommand(input);
        try {
            const response = await this.client.send(command);
            const result = await streamToString(response.Body);
            return result;
        } catch (error) {
            console.log(`Error while getting s3 object key=${key} | error=${JSON.stringify(error)}`);
            return undefined;
        }
    }

    public async putS3Object(key: string, body: object | string): Promise<void> {
        const input = {
            Bucket: process.env.CURVYHOUSES_BUCKET,
            Key: key,
            Body: typeof body === 'string' ? body : JSON.stringify(body),
        };
        const command = new PutObjectCommand(input);
        await this.client.send(command);
    }
}
