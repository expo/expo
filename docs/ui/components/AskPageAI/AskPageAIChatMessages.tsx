import { Button, mergeClasses } from '@expo/styleguide';
import { FileSearch02Icon } from '@expo/styleguide-icons/outline/FileSearch02Icon';
import { ThumbsDownIcon } from '@expo/styleguide-icons/outline/ThumbsDownIcon';
import { ThumbsUpIcon } from '@expo/styleguide-icons/outline/ThumbsUpIcon';
import type { Reaction } from '@kapaai/react-sdk';
import type { MouseEvent } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { FOOTNOTE } from '../Text';
import type { ContextScope, GlobalSwitchStatus, ContextMarker } from './AskPageAIChat.types';
import { normalizeQuestion } from './AskPageAIChat.utils';

type ConversationEntry = {
  id: string | null;
  question: string;
  answer: string;
  sources?: { source_url: string; title?: string }[];
  reaction: Reaction | null;
  isFeedbackSubmissionEnabled?: boolean;
};

type AskPageAIChatMessagesProps = {
  conversation: ConversationEntry[];
  askedQuestions: string[];
  fallbackResponse: string;
  contextScope: ContextScope;
  basePath: string;
  globalSearchRequests: Record<string, boolean>;
  globalSwitchNotices: Record<string, GlobalSwitchStatus>;
  pendingGlobalQuestionKey: string | null;
  markersByIndex: Record<number, ContextMarker[]>;
  isBusy: boolean;
  markdownComponents: Components;
  onSearchAcrossDocs: (question: string) => void;
  extractUserQuestion: (prompt: string, fallback: string) => string;
  onNavigate: (event?: MouseEvent<HTMLAnchorElement>) => void;
  onFeedback: (qaId: string, currentReaction: Reaction | null, reaction: Reaction) => void;
};

export function AskPageAIChatMessages({
  conversation,
  askedQuestions,
  fallbackResponse,
  contextScope,
  basePath,
  globalSearchRequests,
  globalSwitchNotices,
  pendingGlobalQuestionKey,
  markersByIndex,
  isBusy,
  markdownComponents,
  onSearchAcrossDocs,
  extractUserQuestion,
  onNavigate,
  onFeedback,
}: AskPageAIChatMessagesProps) {
  if (conversation.length === 0) {
    return (
      <div className="border-default bg-subtle rounded-md border px-3 py-2 shadow-xs">
        <FOOTNOTE className="text-default font-medium">AI Assistant</FOOTNOTE>
        <div className="text-secondary mt-1 space-y-3 text-sm">
          I'm an SDK AI assistant — ask me a question about the{' '}
          <span className="text-default font-medium">
            {contextScope === 'page' ? 'current page' : 'Expo docs'}
          </span>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {conversation.map((qa, index) => {
        const markers = markersByIndex[index] ?? [];
        const questionFromPrompt = extractUserQuestion(qa.question, qa.question);
        const normalizedQuestion = normalizeQuestion(questionFromPrompt);
        const displayQuestion = askedQuestions[index] ?? questionFromPrompt;
        const normalizedAnswer = qa.answer
          ?.replace(/<br\s*\/?>((\n)?)/gi, '\n')
          ?.replace(/<sup[^>]*>(.*?)<\/sup>/gi, '$1');
        const trimmedAnswer = normalizedAnswer?.trim();
        const trimmedLower = trimmedAnswer?.toLowerCase() ?? '';
        const fallbackLower = fallbackResponse.toLowerCase();
        const hasSources = Array.isArray(qa.sources) && qa.sources.length > 0;
        const normalizedBasePath = basePath.replace(/\/+$/, '');
        const isOffPageAnswer =
          contextScope === 'page' &&
          hasSources &&
          qa.sources!.every(source => !source.source_url.includes(normalizedBasePath));
        const sourcesForDisplay = isOffPageAnswer ? [] : (qa.sources ?? []);
        const isFallbackAnswer =
          trimmedLower.includes(fallbackLower) ||
          trimmedLower.includes('search all expo docs') ||
          isOffPageAnswer;
        const answerForDisplay = isOffPageAnswer ? fallbackResponse : normalizedAnswer;
        const hasTriggeredGlobalSearch = Boolean(globalSearchRequests[normalizedQuestion]);
        const isPendingGlobal = pendingGlobalQuestionKey === normalizedQuestion;
        const isFinalAnswer =
          'isFeedbackSubmissionEnabled' in qa && Boolean((qa as any).isFeedbackSubmissionEnabled);
        const shouldOfferGlobalSearch =
          isFinalAnswer && contextScope === 'page' && isFallbackAnswer;
        const switchStatus = globalSwitchNotices[normalizedQuestion];
        const showSwitchingNotice = Boolean(switchStatus);
        const switchNoticeText =
          switchStatus === 'pending' ? 'Switching to Expo docs.' : 'Switched to Expo docs.';
        const canSubmitFeedback = Boolean(qa.id && qa.isFeedbackSubmissionEnabled);
        const isUpvoted = qa.reaction === 'upvote';
        const isDownvoted = qa.reaction === 'downvote';
        const disableUpvote = !canSubmitFeedback || isDownvoted;
        const disableDownvote = !canSubmitFeedback || isUpvoted;

        return (
          <div key={qa.id ?? `${qa.question}-${index}`} className="space-y-2">
            {markers.map(marker => (
              <div key={`marker-${marker.id}`} className="flex justify-center">
                <FOOTNOTE
                  theme="secondary"
                  className="border-default bg-subtle inline-block rounded-md border px-2 py-1">
                  Switched to <span className="text-default font-medium">{marker.label}.</span>
                </FOOTNOTE>
              </div>
            ))}
            <div className="flex justify-end pr-1">
              <div className="border-default bg-subtle text-secondary ml-auto max-w-[85%] rounded-md border px-3 py-1.5 text-right text-sm leading-snug shadow-xs">
                {displayQuestion}
              </div>
            </div>
            <div className="px-0">
              <FOOTNOTE className="text-default font-medium">AI Assistant</FOOTNOTE>
              <div className="text-secondary mt-1 space-y-3 text-sm">
                {answerForDisplay ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {answerForDisplay}
                  </ReactMarkdown>
                ) : (
                  <FOOTNOTE theme="secondary">
                    {index === conversation.length - 1 && isBusy ? 'Preparing answer...' : ''}
                  </FOOTNOTE>
                )}
              </div>
              {shouldOfferGlobalSearch ? (
                <div className="mt-2 flex flex-col gap-2">
                  <Button
                    type="button"
                    theme="quaternary"
                    size="xs"
                    className="border-default bg-subtle text-default hover:bg-element focus-visible:ring-palette-blue9 inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isBusy || hasTriggeredGlobalSearch || isPendingGlobal}
                    onClick={() => {
                      onSearchAcrossDocs(displayQuestion);
                    }}>
                    <FileSearch02Icon className="icon-xs text-icon-secondary mr-2" />
                    {hasTriggeredGlobalSearch || isPendingGlobal
                      ? 'Searching Expo docs…'
                      : 'Search Expo docs'}
                  </Button>
                  {showSwitchingNotice ? (
                    <FOOTNOTE theme="secondary" className="text-sm">
                      {switchNoticeText}
                    </FOOTNOTE>
                  ) : null}
                </div>
              ) : null}
              {canSubmitFeedback ? (
                <div className="text-secondary mt-3 flex items-center gap-1 text-sm">
                  <span className="text-secondary">Was this helpful?</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      theme="quaternary"
                      size="xs"
                      className="text-secondary! hover:text-default! focus:text-default! px-2 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Upvote answer"
                      aria-pressed={isUpvoted}
                      disabled={disableUpvote}
                      onClick={() => {
                        if (!qa.id) {
                          return;
                        }
                        onFeedback(qa.id, qa.reaction ?? null, 'upvote');
                      }}>
                      <ThumbsUpIcon
                        className={mergeClasses(
                          'icon-xs',
                          isUpvoted ? 'text-icon-success' : 'text-icon-default'
                        )}
                      />
                    </Button>
                    <Button
                      type="button"
                      theme="quaternary"
                      size="xs"
                      className="text-secondary! hover:text-default! focus:text-default! px-2 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Downvote answer"
                      aria-pressed={isDownvoted}
                      disabled={disableDownvote}
                      onClick={() => {
                        if (!qa.id) {
                          return;
                        }
                        onFeedback(qa.id, qa.reaction ?? null, 'downvote');
                      }}>
                      <ThumbsDownIcon
                        className={mergeClasses(
                          'icon-xs',
                          isDownvoted ? 'text-icon-danger' : 'text-icon-default'
                        )}
                      />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            {sourcesForDisplay?.length ? (
              <FOOTNOTE theme="secondary" className="ml-1 text-sm">
                Sources:{' '}
                {sourcesForDisplay.map((source, sourceIdx, sources) => (
                  <span key={source.source_url}>
                    <a
                      className="text-link"
                      href={source.source_url}
                      onClick={event => {
                        onNavigate(event);
                      }}>
                      {source.title ?? `Source ${sourceIdx + 1}`}
                    </a>
                    {sourceIdx < sources.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </FOOTNOTE>
            ) : null}
          </div>
        );
      })}
      {markersByIndex[conversation.length]?.map(marker => (
        <div key={`marker-${marker.id}`} className="flex justify-center">
          <FOOTNOTE
            theme="secondary"
            className="border-default bg-subtle inline-block rounded-md border px-2 py-1">
            Switched to <span className="text-default font-medium">{marker.label}.</span>
          </FOOTNOTE>
        </div>
      ))}
    </div>
  );
}
