/** @type {import('expo-router/server').RequestHandler} */
export async function GET() {
  const path = await import(/* @metro-ignore */ 'path');

  return new Response(
    JSON.stringify({
      method: path.join('get', 'method'),
    })
  );
}
