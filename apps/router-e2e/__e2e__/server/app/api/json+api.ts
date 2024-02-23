export async function POST(req: Request): Promise<Response> {
  // Can serialize JSON -- this was a problem during development due to some earlier middleware (/logs) that were corrupting the request.
  const json = await req.json();
  return new Response(JSON.stringify(json));
}
