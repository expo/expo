import { JS_THREAD_TRIGGERS } from '@/components/hangTriggers.shared';
import type { HangTrigger } from '@/components/hangTriggers.types';
import CrashTester from '@/modules/crash-tester';

export const HANG_TRIGGERS: HangTrigger[] = [
  ...JS_THREAD_TRIGGERS,
  {
    title: 'Block main thread for 10 s',
    description:
      'Tap the screen during the block. In the ANR dialog, choose "Close app" and relaunch',
    run: () => CrashTester?.blockMainThread(10),
  },
  {
    title: 'Exhaust Java heap',
    description: 'OutOfMemoryError crash',
    run: () => CrashTester?.exhaustJavaHeap?.(),
  },
  {
    title: 'Fill native memory',
    description: 'May cause a low-memory kill, reported on the next launch',
    run: () => CrashTester?.fillNativeMemory?.(),
  },
];
