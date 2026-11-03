export function GET(_request: Request, { dynamic }: Record<string, string>): Response {
  return Response.json({ hello: dynamic });
}
