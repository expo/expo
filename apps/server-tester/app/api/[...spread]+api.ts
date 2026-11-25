export function GET(_request: Request, { spread }: Record<string, string>): Response {
  return Response.json({ results: spread });
}
