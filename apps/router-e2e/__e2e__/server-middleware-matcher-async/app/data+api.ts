/** @type {import('expo-router/server').RequestHandler} */
export function POST() {
  return new Response(
    JSON.stringify({
      method: 'post',
      route: 'data',
    })
  );
}