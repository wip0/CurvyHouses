import { Constant } from '../constant';
import { LineReqBody } from '../interfaces';

export function logPayloadDebug(body: LineReqBody) {
    const debugLog = {
        type: 'line-webhook',
        response: body
    };
    console.log(JSON.stringify(debugLog));
}

export function numberWithCommas(num: number, fixDecimal: number = Constant.FIX_DECIMAL_PLACE) {
    return num.toFixed(fixDecimal).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

export function validateLinePayload(body: LineReqBody | any): body is LineReqBody {
    return !!body?.events;
}
