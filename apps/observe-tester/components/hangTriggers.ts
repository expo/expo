import type { HangTrigger } from '@/components/hangTriggers.types';

// Web does not report long tasks and has no native crash tester, so there is nothing to trigger.
export const HANG_TRIGGERS: HangTrigger[] = [];
