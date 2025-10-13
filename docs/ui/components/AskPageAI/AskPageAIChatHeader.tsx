import { Button, mergeClasses } from '@expo/styleguide';
import { Maximize02Icon } from '@expo/styleguide-icons/outline/Maximize02Icon';
import { Minimize02Icon } from '@expo/styleguide-icons/outline/Minimize02Icon';
import { RefreshCcw02Icon } from '@expo/styleguide-icons/outline/RefreshCcw02Icon';
import { Star06Icon } from '@expo/styleguide-icons/outline/Star06Icon';
import { ThumbsDownIcon } from '@expo/styleguide-icons/outline/ThumbsDownIcon';
import { ThumbsUpIcon } from '@expo/styleguide-icons/outline/ThumbsUpIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import type { Reaction } from '@kapaai/react-sdk';
import { useMemo, type CSSProperties } from 'react';

import type { ContextScope, FeedbackTarget } from './AskPageAIChat.types';
import { FOOTNOTE } from '../Text';

type AskPageAIChatHeaderProps = {
  displayContextLabel: string;
  contextScope: ContextScope;
  isExpanded: boolean;
  onToggleExpand?: () => void;
  onReset: () => void;
  onClose: () => void;
  feedbackTarget: FeedbackTarget;
  onFeedback: (reaction: Reaction) => void;
};

export function AskPageAIChatHeader({
  displayContextLabel,
  contextScope,
  isExpanded,
  onToggleExpand,
  onReset,
  onClose,
  feedbackTarget,
  onFeedback,
}: AskPageAIChatHeaderProps) {
  const closeButtonThemeOverrides = useMemo(
    () =>
      ({
        '--expo-theme-button-quaternary-hover': 'rgba(255,255,255,0.12)',
        '--expo-theme-button-quaternary-text': '#ffffff',
        '--expo-theme-button-quaternary-icon': '#ffffff',
      }) as CSSProperties,
    []
  );

  const headerAccentBackground = useMemo(() => ({ backgroundColor: 'rgba(255,255,255,0.1)' }), []);

  const activeFeedbackBackground = useMemo(
    () => ({ backgroundColor: 'rgba(255,255,255,0.12)' }),
    []
  );

  return (
    <div className="flex flex-col gap-3 border-b border-default bg-palette-black px-4 py-3 text-palette-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={mergeClasses(
              'inline-flex size-8 items-center justify-center rounded-full bg-palette-white shadow-xs'
            )}
            style={headerAccentBackground}>
            <Star06Icon className="icon-sm text-palette-white" />
          </span>
          <span className="text-sm font-medium leading-tight text-palette-white">
            Expo AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            aria-label="Provide positive feedback"
            theme="quaternary"
            size="xs"
            className="px-2 !text-palette-white hover:!text-palette-white focus:!text-palette-white"
            style={{
              ...closeButtonThemeOverrides,
              ...(feedbackTarget?.reaction === 'upvote' ? activeFeedbackBackground : {}),
            }}
            aria-pressed={feedbackTarget?.reaction === 'upvote'}
            disabled={!feedbackTarget?.isFeedbackSubmissionEnabled}
            onClick={() => {
              onFeedback('upvote');
            }}>
            <ThumbsUpIcon className="icon-xs text-palette-white" />
          </Button>
          <Button
            type="button"
            aria-label="Provide negative feedback"
            theme="quaternary"
            size="xs"
            className="px-2 !text-palette-white hover:!text-palette-white focus:!text-palette-white"
            style={{
              ...closeButtonThemeOverrides,
              ...(feedbackTarget?.reaction === 'downvote' ? activeFeedbackBackground : {}),
            }}
            aria-pressed={feedbackTarget?.reaction === 'downvote'}
            disabled={!feedbackTarget?.isFeedbackSubmissionEnabled}
            onClick={() => {
              onFeedback('downvote');
            }}>
            <ThumbsDownIcon className="icon-xs text-palette-white" />
          </Button>
          {onToggleExpand ? (
            <Button
              type="button"
              aria-label={isExpanded ? 'Restore Ask AI assistant size' : 'Expand Ask AI assistant'}
              theme="quaternary"
              size="xs"
              className="px-2 !text-palette-white hover:!text-palette-white focus:!text-palette-white"
              style={closeButtonThemeOverrides}
              aria-pressed={isExpanded}
              onClick={onToggleExpand}>
              {isExpanded ? (
                <Minimize02Icon className="icon-xs text-palette-white" />
              ) : (
                <Maximize02Icon className="icon-xs text-palette-white" />
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            aria-label="Reset conversation"
            theme="quaternary"
            size="xs"
            className="px-2 !text-palette-white hover:!text-palette-white focus:!text-palette-white"
            style={closeButtonThemeOverrides}
            onClick={onReset}>
            <RefreshCcw02Icon className="icon-xs text-palette-white" />
          </Button>
          <Button
            aria-label="Close Ask AI assistant"
            theme="quaternary"
            size="xs"
            className="px-2 !text-palette-white hover:!text-palette-white focus:!text-palette-white"
            style={closeButtonThemeOverrides}
            onClick={onClose}>
            <XIcon className="icon-xs text-palette-white" />
          </Button>
        </div>
      </div>
      <FOOTNOTE className="text-palette-white">
        Ask a question about{' '}
        <span className="font-semibold">
          {contextScope === 'page' ? displayContextLabel : 'the Expo docs'}
        </span>
        .
      </FOOTNOTE>
    </div>
  );
}
