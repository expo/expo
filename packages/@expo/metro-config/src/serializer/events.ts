import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'serializer:hermes:build_started': { command: string; args: string };
    'serializer:side_effects:invalid_field': { path: string };
  }
}

export const event = events.debug('serializer');
