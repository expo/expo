export async function POST(req: Request): Promise<Response> {
  console.log(req);
  // Can serialize JSON -- this was a problem during development due to some earlier middleware (/logs) that were corrupting the request.
  const json = await req.json();
  // @ts-expect-error: Will be fixed with TypeScript upgrade
  return new Response.json(json);
}
