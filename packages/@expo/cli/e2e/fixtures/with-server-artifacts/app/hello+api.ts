export async function GET(request: Request) {
  if (new URL(request.url).searchParams.has('error')) {
    try {
      throw new Error('mapped API error');
    } catch (error) {
      return Response.json({ stack: (error as Error).stack });
    }
  }
  const { message } = await import('../data');
  return Response.json({ message });
}
