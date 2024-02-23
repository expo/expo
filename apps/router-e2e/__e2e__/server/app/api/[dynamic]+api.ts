export function GET(req: Request): Response {
  // curl -d "param1=value1&param2=value2" -X POST http://localhost:8082/data
  return new Response(JSON.stringify({ hello: req.expoUrl.searchParams.get('dynamic') }));
}
