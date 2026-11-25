import type { CrashTrigger } from '@/components/crashTriggers.types';

// Descriptions name the Mach exception / Unix signal each trigger produces on iOS.
export const CRASH_TRIGGERS: CrashTrigger[] = [
  { kind: 'badAccess', title: 'Bad access', description: 'EXC_BAD_ACCESS / SIGSEGV' },
  { kind: 'fatalError', title: 'Fatal error', description: 'EXC_CRASH / SIGABRT' },
  { kind: 'divideByZero', title: 'Divide by zero', description: 'EXC_ARITHMETIC / SIGFPE' },
  { kind: 'forceUnwrapNil', title: 'Force-unwrap nil', description: 'EXC_BAD_INSTRUCTION' },
  { kind: 'arrayOutOfBounds', title: 'Array out of bounds', description: 'EXC_BAD_INSTRUCTION' },
  { kind: 'objcException', title: 'NSException', description: 'Uncaught Objective-C exception' },
  { kind: 'stackOverflow', title: 'Stack overflow', description: 'Unbounded recursion' },
];
