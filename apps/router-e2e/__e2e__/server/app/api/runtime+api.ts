import { environment, origin } from '@expo/server';

export function GET(): Response {
  return new Response(JSON.stringify({
    environment: environment(),
    origin: origin(),
  }));
}
