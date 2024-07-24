export async function POST(_req: Request): Promise<Response> {
  return Response.redirect("http://test.com/redirect", 302);
}

export async function GET(_req: Request): Promise<Response> {
  // NOTE: Expected to throw a RangeError
  return Response.redirect("http://test.com/redirect", 500);
}
