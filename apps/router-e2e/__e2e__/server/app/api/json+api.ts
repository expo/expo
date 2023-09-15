import { ExpoRequest, ExpoResponse } from 'expo-router/server';

export async function POST(req: ExpoRequest): Promise<ExpoResponse> {
  // Can serialize JSON -- this was a problem during development due to some earlier middleware (/logs) that were corrupting the request.
  const json = await req.json();
  return ExpoResponse.json(json);
}
