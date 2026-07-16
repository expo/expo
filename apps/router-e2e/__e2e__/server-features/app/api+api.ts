export function GET() {
  return Response.json({
    method: 'get',
    route: 'api',
  });
}

export function POST() {
  return Response.json({
    method: 'post',
    route: 'api',
  });
}
