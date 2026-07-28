import type { CrashTrigger } from '@/components/crashTriggers.types';

// Descriptions name the JVM throwable each trigger produces on Android. `badAccess` is a bare
// SIGSEGV (process death without a tombstone); the OS records it as a signal kill, which now
// counts as a crash, so it stores a signal-only report with no Java stack trace — unlike the JVM
// kinds below.
export const CRASH_TRIGGERS: CrashTrigger[] = [
  { kind: 'badAccess', title: 'Bad access', description: 'SIGSEGV signal — signal-only report' },
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
