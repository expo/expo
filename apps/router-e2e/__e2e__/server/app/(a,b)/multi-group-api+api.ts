/** @type {import('expo-router/server').RequestHandler} */
export function GET() {
  return new Response(
    JSON.stringify({
      value: 'multi-group-api-get',
    })
  );
}
