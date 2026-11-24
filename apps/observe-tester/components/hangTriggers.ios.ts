import { JS_THREAD_TRIGGERS } from '@/components/hangTriggers.shared';
import type { HangTrigger } from '@/components/hangTriggers.types';
import CrashTester from '@/modules/crash-tester';

export const HANG_TRIGGERS: HangTrigger[] = [
  ...JS_THREAD_TRIGGERS,
  {
    title: 'Block main thread for 2 s',
    description: 'MetricKit hang diagnostic, on a device only',
    run: () => CrashTester?.blockMainThread(2),
  },
];
