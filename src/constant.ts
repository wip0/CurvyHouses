export const Constant = {
    Color: {
        GREEN: '#00bf33',
        RED: '#dd0000',
        GREY: '#666666',
    },
    FIX_DECIMAL_PLACE: 2,
};

export const LineChannel = {
    TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN as string,
    SECRET: process.env.LINE_CHANNEL_SECRET as string,
};

export const LineConfiguration = {
    channelAccessToken: LineChannel.TOKEN,
    channelSecret: LineChannel.SECRET,
};

export const MarketStock = {
    API_ENDPOINT: process.env.MARKETSTOCK_ENDPOINT as string,
    API_KEY: process.env.MARKETSTOCK_API_KEY as string,
};