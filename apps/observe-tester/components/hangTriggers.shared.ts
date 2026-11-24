import type { HangTrigger } from '@/components/hangTriggers.types';

// A busy loop, so the JavaScript thread cannot run anything else until it ends.
function blockJSThread(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

export const JS_THREAD_TRIGGERS: HangTrigger[] = [
  {
    title: 'Block JS thread for 300 ms',
    description: 'Shorter than the 500 ms threshold, so no event',
    run: () => blockJSThread(300),
  },
  {
    title: 'Block JS thread for 1 s',
    description: 'js.exception warning with source longTask',
    run: () => blockJSThread(1000),
  },
];
