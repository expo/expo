import type { Reaction } from '@kapaai/react-sdk';

export type ContextScope = 'page' | 'global';

export type GlobalSwitchStatus = 'pending' | 'done';

export type ContextMarker = { id: string; at: number; label: string };

export type FeedbackTarget = {
  id?: string | null;
  reaction: Reaction | null;
  isFeedbackSubmissionEnabled: boolean;
} | null;
