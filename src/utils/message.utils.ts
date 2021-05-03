import { FlexBox, FlexMessage, FlexSeparator, TextMessage } from '@line/bot-sdk';
import { Constant } from '../constant';
import { SeperatorMargin } from '../interfaces';
import * as Utils from './utils';

export function buildEodRowBox(key: string, value: string, color?: string): FlexBox {
    return {
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
            {
                type: 'text',
                text: key,
                color: '#aaaaaa',
                size: 'sm',
                flex: 1,
            },
            {
                type: 'text',
                text: value,
                wrap: true,
                color: color ?? '#666666',
                size: 'sm',
                flex: 3,
                align: 'end',
                weight: 'bold',
            }
        ]
    }
}

export function buildEodFlexMessage(
    symbol: string,
    date: Date,
    open: number,
    close: number,
    high: number,
    low: number,
    volume: number,
    adjOpen: number,
    adjClose: number,
    adjHigh: number,
    adjLow: number,
    ma?: number,
    fullDetail: boolean = false
): FlexMessage {
    const change = close - open;
    const changePercentage = Utils.numberWithCommas(change / open * 100);
    const sumColor = change > 0 ? Constant.Color.GREEN : change < 0 ? Constant.Color.RED : Constant.Color.GREY;

    const defaultContentPart = [
        buildSeperator(),
        {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
                buildEodRowBox('Open', Utils.numberWithCommas(open)),
                buildEodRowBox('Close', Utils.numberWithCommas(close)),
                buildEodRowBox('High', Utils.numberWithCommas(high), Constant.Color.GREEN),
                buildEodRowBox('Low', Utils.numberWithCommas(low), Constant.Color.RED),
            ],
        } as FlexBox,
    ];

    const adjustContentPart = fullDetail ?
        [
            buildSeperator(),
            {
                type: 'box',
                layout: 'vertical',
                margin: 'lg',
                spacing: 'sm',
                contents: [
                    buildEodRowBox('Adj.Open', Utils.numberWithCommas(adjOpen)),
                    buildEodRowBox('Adj.Close', Utils.numberWithCommas(adjClose)),
                    buildEodRowBox('Adj.High', Utils.numberWithCommas(adjHigh), Constant.Color.GREEN),
                    buildEodRowBox('Adj.Low', Utils.numberWithCommas(adjLow), Constant.Color.RED),
                ],
            } as FlexBox,
        ] :
        [];
    const maPart = ma ?
        [
            buildSeperator(),
            {
                type: 'box',
                layout: 'vertical',
                margin: 'lg',
                spacing: 'sm',
                contents: [
                    buildEodRowBox('MA5', Utils.numberWithCommas(ma)),
                ],
            } as FlexBox,
        ] :
        [];

    return {
        type: 'flex',
        altText: `Show ${symbol}`,
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: symbol,
                        weight: 'bold',
                        size: 'md',
                        margin: 'md',
                    },
                    {
                      type: 'text',
                      text: String(close),
                      size: 'xxl',
                      weight: 'bold',
                      color: sumColor,
                    },
                    {
                      type: 'text',
                      text: `(${changePercentage}%)`,
                      size: 'xxs',
                      color: sumColor,
                    },
                    {
                      type: 'text',
                      text: `Volume ${Utils.numberWithCommas(volume, 0)}`,
                      size: 'xxs',
                      color: Constant.Color.GREY,
                    },
                    ...defaultContentPart,
                    ...adjustContentPart,
                    ...maPart,
                    buildSeperator(),
                    {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'text',
                                text: Utils.toReadableDate(date),
                                size: 'xxs',
                                color: Constant.Color.GREY,
                                align: 'end',
                            }
                        ],
                    },
                ]
            }
        }
    }
}

export function buildSeperator(margin: SeperatorMargin = 'xl'): FlexSeparator {
    return {
      type: 'separator',
      margin
    };
}

export function buildTextMessage(text: string): TextMessage {
    return {
        type: 'text',
        text
    };
}
