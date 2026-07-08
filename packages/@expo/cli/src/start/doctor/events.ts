import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'doctor:check': {
      name: string;
      platform?: string;
      satisfied: boolean;
      message?: string;
    };
    'doctor:dependencies:missing': {
      packages: string[];
    };
  }
}

export const event = events('doctor');
