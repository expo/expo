import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'ssr:eval_filename_not_in_dir': { filename: string };
    'ssr:eval_filename_outside_root': { filename: string };
    'ssr:html_async_chunk_linked': { filename: string; contextKey: string };
  }
}

export const event = events.debug('ssr');
