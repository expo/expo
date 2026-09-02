import type { CrashTrigger } from '@/components/crashTriggers.types';

// Default fallback (e.g. web): no native crash tester, so there are no triggers to offer.
export const CRASH_TRIGGERS: CrashTrigger[] = [];
