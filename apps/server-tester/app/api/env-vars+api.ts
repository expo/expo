export function GET(): Response {
  return Response.json({
    var: process.env.TEST_SECRET_KEY,
  });
}
