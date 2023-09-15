import { ExpoRequest, ExpoResponse } from 'expo-router/server';

export function GET(req: ExpoRequest): ExpoResponse {
  return ExpoResponse.json({ results: req.expoUrl.searchParams.get('spread') });
}
