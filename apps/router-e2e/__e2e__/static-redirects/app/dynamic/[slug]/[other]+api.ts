/** @type {import('expo-router/server').RequestHandler} */
export function GET() {
  return new Response(
    JSON.stringify({
      method: 'get',
    })
  );
}
