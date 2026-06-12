import type { CrashTrigger } from '@/components/crashTriggers.types';

// Descriptions name the JVM throwable each trigger produces on Android. `badAccess` is a bare
// SIGSEGV (process death without a tombstone), which is outside the crash allowlist, so it stores
// no report — unlike the JVM kinds below.
export const CRASH_TRIGGERS: CrashTrigger[] = [
  { kind: 'badAccess', title: 'Bad access', description: 'SIGSEGV signal — no report stored' },
  { kind: 'fatalError', title: 'Fatal error', description: 'RuntimeException' },
  { kind: 'divideByZero', title: 'Divide by zero', description: 'ArithmeticException' },
  { kind: 'forceUnwrapNil', title: 'Null dereference', description: 'NullPointerException' },
  {
    kind: 'arrayOutOfBounds',
    title: 'Array out of bounds',
    description: 'IndexOutOfBoundsException',
  },
  { kind: 'objcException', title: 'Uncaught exception', description: 'IllegalStateException' },
  { kind: 'stackOverflow', title: 'Stack overflow', description: 'StackOverflowError' },
];
