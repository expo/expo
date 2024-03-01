export function GET(): Response {
  return new Response(JSON.stringify({
    var: process.env.TEST_SECRET_KEY,
  }));
}
