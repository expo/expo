export async function POST(): Promise<Response> {
  return Response.redirect('http://test.com/redirect', 302);
}

export async function GET(): Promise<Response> {
  // 500 is not a redirect status, so this throws a RangeError on purpose.
  return Response.redirect('http://test.com/redirect', 500);
}
