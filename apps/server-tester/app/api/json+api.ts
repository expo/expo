export async function POST(request: Request): Promise<Response> {
  const json = await request.json();
  return Response.json(json);
}
