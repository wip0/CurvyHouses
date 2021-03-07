async function curvyhousesHandler(_event: any, _context: any) {
  return {
    'isBase64Encoded': false,
    'statusCode': 200,
    'statusDescription': '200 OK',
    'headers': {
      'Set-cookie': 'cookies',
      'Content-Type': 'application/json'
    },
    'body': JSON.stringify({
      data: {
        'message': 'setup from webpack!'
      }
    })
  }
}


export const handler = curvyhousesHandler