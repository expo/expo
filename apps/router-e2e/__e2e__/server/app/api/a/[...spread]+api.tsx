export function GET(_req: Request, { spread }): Response {
  return new Response(JSON.stringify({ results: spread }));
}
