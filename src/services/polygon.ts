import * as request from 'request';
import { Response } from 'request';
import { PolygonDailyOpenCloseResponse } from '../line-web-hook/interfaces';

export class PolygonService {
    public checkMarketOpen(symbol: string, date: Date): Promise<boolean> {
        const formattedDate = this.formatDate(date);
        const adjust = true;
        const apiKey = '6qcwubDE8G399eS9lvkMUTZ1i_a6X84Q';
        return new Promise<boolean>((resolve, reject) => {
            request.get(
                `http://api.polygon.io/v1/open-close/${symbol}/${formattedDate}`,
                {
                    qs: {
                        adjust,
                        apiKey,
                    }
                }, async (err: any, response: Response, body: any) => {
                    if (err) {
                        reject(err);
                    }
                    const payload = JSON.parse(body) as PolygonDailyOpenCloseResponse;
                    resolve(payload.status === 'OK');
                }
            );
        })
    }

    private formatDate(date: Date): string {
        var mm = date.getMonth() + 1; // getMonth() is zero-based
        var dd = date.getDate();
      
        return [
            date.getFullYear(),
            (mm > 9 ? '' : '0') + mm,
            (dd > 9 ? '' : '0') + dd
        ].join('-');
    }
}
