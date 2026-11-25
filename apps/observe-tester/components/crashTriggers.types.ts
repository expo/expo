import type { CrashKind } from '@/modules/crash-tester';

export type CrashTrigger = { kind: CrashKind; title: string; description: string };
