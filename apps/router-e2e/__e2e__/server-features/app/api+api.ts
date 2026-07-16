/** @type {import('expo-router/server').RequestHandler} */
export function GET() {
  return Response.json({
    method: 'get',
    route: 'api',
  });
}

/** @type {import('expo-router/server').RequestHandler} */
export function POST() {
  return Response.json({
    method: 'post',
    route: 'api',
  });
}
