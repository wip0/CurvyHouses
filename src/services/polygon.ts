import * as request from 'request';
import { Response } from 'request';
import { Polygon } from '../line-web-hook/constant';
import { PolygonDailyOpenCloseResponse } from '../line-web-hook/interfaces';

export class PolygonService {
    public checkMarketOpen(symbol: string, date: Date): Promise<boolean> {
        const formattedDate = this.formatDate(date);
        return new Promise<boolean>((resolve, reject) => {
            request.get(
                `http://api.polygon.io/v1/open-close/${symbol}/${formattedDate}`,
                {
                    qs: {
                        adjust: true,
                        apiKey: Polygon.POLYGON_API_KEY,
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
