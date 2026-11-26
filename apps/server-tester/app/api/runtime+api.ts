import { environment, origin } from 'expo-server';

export function GET(): Response {
  return Response.json({
    environment: environment(),
    origin: origin(),
  });
}
