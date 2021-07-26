import { SQSClient } from "@aws-sdk/client-sqs";
import { CURVYHOUSES_QUEUE_URL, SqsHelper } from '../helpers/sqs';
import { CloudwatchEvent, FSA, NotifyPayload } from '../interfaces';
import { MarketStack } from '../line-web-hook/constant';
import { PolygonService } from "../services/polygon";
import { scrapeSnP500List } from "../utils/snp-scraper";

const MAX_PROCESS_SYMBOL = process.env.MAX_SYMBOLS ? Number(process.env.MAX_SYMBOLS) : undefined;

export class SNP500Handler {
    constructor(
        private polygonService: PolygonService,
        private sqsHelper: SqsHelper,
    ) {}

    public async handleRequest(event: CloudwatchEvent) {
        const today = new Date();
        const yesterday = new Date(today.setDate(today.getDate() - 1));
        const isMarketOpen = await this.polygonService.checkMarketOpen('AAPL', yesterday);
        if (!isMarketOpen) {
            console.log('Market is closed');
            return;
        }
        const snp500List = await scrapeSnP500List();
        const symbolList = snp500List.slice(0, MAX_PROCESS_SYMBOL || snp500List.length);
        const licenseList = ['0b6bcc2612696de970150a09fd1c558d', MarketStack.API_KEY];
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
    const polygonService = new PolygonService();

    const sqsHelper = new SqsHelper(sqsClient);

    const snpHandler = new SNP500Handler(polygonService, sqsHelper);
    return snpHandler;
}


const sqsHandler = buildHandler();
export const handler = sqsHandler.handleRequest.bind(sqsHandler);
 