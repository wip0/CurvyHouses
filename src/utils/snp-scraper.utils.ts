import * as cheerio from 'cheerio';
import * as request from 'request';

const snpWikiEndpoint = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies';

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

export async function scrapeSnP500List(): Promise<string[]> {
    const wikiResponse = await requestWiki();
    const c = cheerio.load(wikiResponse);
    const result: string[] = [];
    c('#constituents.wikitable.sortable tbody tr td:first-child').each((idx, element) => {
        result.push(c(element).text().trim())
    });
    return result;
};
