import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'api:download': {
      url: string;
      bytes: number;
      ms: number;
    };
  }
}

export const event = events('api');
