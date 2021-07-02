import { SQSClient } from "@aws-sdk/client-sqs";
import { CURVYHOUSES_QUEUE_URL, SqsHelper } from '../helpers/sqs.helper';
import { CloudwatchEvent, FSA, NotifyPayload } from '../interfaces';
import { MarketStack } from '../line-web-hook/constant';
import { scrapeSnP500List } from "../utils/snp-scraper.utils";

const MAX_PROCESS_SYMBOL = process.env.MAX_SYMBOLS ? Number(process.env.MAX_SYMBOLS) : undefined;

export class SNP500Handler {
    constructor(
        private sqsHelper: SqsHelper,
    ) {}

    public async handleRequest(event: CloudwatchEvent) {
        const snp500List = await scrapeSnP500List();
        const symbolList = snp500List.slice(0, MAX_PROCESS_SYMBOL || snp500List.length);
        const licenseList = [MarketStack.API_KEY];
        const sqsBody: FSA<NotifyPayload> = {
            type: 'NOTIFY',
            payload: {
                symbols: symbolList,
                licenses: licenseList,
                signals: {
                    buy: [],
                    sell: [],
                    signal: 'SMA(Close,200)'
                },
                key: 'snp500',
            },
        };
        await this.sqsHelper.sendSqsMessage(CURVYHOUSES_QUEUE_URL, sqsBody);
    }
}

function buildHandler(): SNP500Handler {
    const sqsClient = new SQSClient({ region: process.env.AWS_REGION});

    const sqsHelper = new SqsHelper(sqsClient);

    const snpHandler = new SNP500Handler(sqsHelper);
    return snpHandler;
}


const sqsHandler = buildHandler();
export const handler = sqsHandler.handleRequest.bind(sqsHandler);
 