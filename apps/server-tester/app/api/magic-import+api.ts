export async function GET(): Promise<Response> {
  const path = await import(/* @metro-ignore */ 'path');
  return Response.json({ method: path.join('get', 'method') });
}
