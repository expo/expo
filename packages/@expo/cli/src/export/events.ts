import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'export:done': {
      platforms: string[];
      outputDir: string;
      mode: 'static' | 'server' | 'single';
      dev: boolean;
    };
    'export:bundle': {
      platform: string;
      assets: number;
      ms: number;
    };
    'export:static:routes': {
      total: number;
      withLoaders: number;
    };
  }
}

export const event = events('export');
