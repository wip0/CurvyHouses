exports.handler = async function (event, context) {
    return {
        "isBase64Encoded": false,
        "statusCode": 200,
        "statusDescription": "200 OK",
        "headers": {
            "Set-cookie": "cookies",
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            data: {
                "message": "hello world from lambda!"
            }
        })
    }
}
