import { ExpoRequest, ExpoResponse } from 'expo-router/server';

export function GET(req: ExpoRequest): ExpoResponse {
  // curl -d "param1=value1&param2=value2" -X POST http://localhost:8082/data
  return ExpoResponse.json({ hello: req.expoUrl.searchParams.get('dynamic') });
}
