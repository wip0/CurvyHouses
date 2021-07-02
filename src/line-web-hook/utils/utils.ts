import { Constant } from '../constant';

export function numberWithCommas(num: number, fixDecimal: number = Constant.FIX_DECIMAL_PLACE) {
    return num.toFixed(fixDecimal).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

export function toReadableDate(date: Date): string {
    const dd = `${date.getDate()}`.padStart(2, '0');
    const mm = `${date.getMonth() + 1}`.padStart(2, '0'); 
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
