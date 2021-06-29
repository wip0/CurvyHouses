import * as request from 'request';
import * as cheerio from 'cheerio';
import * as MarketstackService from '../line-web-hook/services/marketstack.service';

const { ma } = require('moving-averages');

const snpWikiEndpoint = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies';
const MAX_PROCESS_SYMBOL = 2;

async function requestWiki(): Promise<string> {
    return new Promise((resolve, reject) => {
        request.get({
            url: snpWikiEndpoint,
        }, (err: Error, res: any, body: string) => {
            if (err) {
                console.log(err);
                reject(err);
            }

            resolve(body);
        });
    })
}

async function scrapeSnP500List(): Promise<string[]> {
    const wikiResponse = await requestWiki();
    const c = cheerio.load(wikiResponse);
    const result: string[] = [];
    c('#constituents.wikitable.sortable tbody tr td:first-child').each((idx, element) => {
        result.push(c(element).text().trim())
    });
    return result;
};

interface CloudwatchEvent {
    version: string;
    id: string;
    'detail-type': string;
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: {}
}


export const handler = async (event: CloudwatchEvent) => {
    const snp500List = await scrapeSnP500List();
    const symbolList = snp500List.slice(0, MAX_PROCESS_SYMBOL);
    const signalPromises = symbolList.map(async (symbol) => {
        const MA_BAR = 200;
        const eodResponse = await MarketstackService.getEodData(symbol, MA_BAR + 1);
        const data = eodResponse.data.sort((eod1, eod2) => new Date(eod1.date).getTime() > new Date(eod2.date).getTime() ? 1 : -1);
        const closeData = data.map(item => item.close)
        const closeMas = ma(closeData, MA_BAR);

        const closeToday = closeData[closeData.length - 1];
        const closeYesterday = closeData[closeData.length - 2];

        const closeMaToday = closeMas[closeMas.length - 1];
        const closeMaYesterday = closeMas[closeMas.length - 2];

        let signal = 0;
        if (closeYesterday < closeMaYesterday && closeToday > closeMaToday) {
            signal = 1;
        }
        if (closeYesterday > closeMaYesterday && closeToday < closeMaToday) {
            signal = -1;
        }
        return {
            symbol,
            signal,
        };
    });
    const signals: { symbol: string, signal: number }[] = await Promise.all(signalPromises);
    console.log(JSON.stringify(signals));
    
    return {
        statusCode: 200,
        body: 'hello world'
    };
};