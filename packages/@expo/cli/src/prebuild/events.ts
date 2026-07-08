import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'prebuild:done': {
      platforms: string[];
      clean: boolean;
      template?: string;
    };
    'prebuild:template:resolved': {
      source: 'local' | 'npm' | 'git';
      name: string;
      version?: string;
    };
    'prebuild:pods:installed': {
      ms: number;
      skipped: boolean;
    };
    'prebuild:dependencies:installed': {
      packageManager: string;
      ms: number;
      skipped: boolean;
    };
  }
}

export const event = events('prebuild');
