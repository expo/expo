import { Button } from '@expo/styleguide';
import { FileSearch02Icon } from '@expo/styleguide-icons/outline/FileSearch02Icon';
import type { MouseEvent } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { ContextScope, GlobalSwitchStatus, ContextMarker } from './AskPageAIChat.types';
import { FOOTNOTE } from '../Text';
import { normalizeQuestion } from './AskPageAIChat.utils';

type ConversationEntry = {
  id: string | null;
  question: string;
  answer: string;
  sources?: { source_url: string; title?: string }[];
  isFeedbackSubmissionEnabled?: boolean;
};

type AskPageAIChatMessagesProps = {
  conversation: ConversationEntry[];
  askedQuestions: string[];
  fallbackResponse: string;
  contextScope: ContextScope;
  globalSearchRequests: Record<string, boolean>;
  globalSwitchNotices: Record<string, GlobalSwitchStatus>;
  pendingGlobalQuestionKey: string | null;
  markersByIndex: Record<number, ContextMarker[]>;
  isBusy: boolean;
  markdownComponents: Components;
  onSearchAcrossDocs: (question: string) => void;
  extractUserQuestion: (prompt: string, fallback: string) => string;
  onNavigate: (event?: MouseEvent<HTMLAnchorElement>) => void;
};

export function AskPageAIChatMessages({
  conversation,
  askedQuestions,
  fallbackResponse,
  contextScope,
  globalSearchRequests,
  globalSwitchNotices,
  pendingGlobalQuestionKey,
  markersByIndex,
  isBusy,
  markdownComponents,
  onSearchAcrossDocs,
  extractUserQuestion,
  onNavigate,
}: AskPageAIChatMessagesProps) {
  if (conversation.length === 0) {
    return (
      <div className="rounded-md border border-default bg-subtle px-3 py-2 shadow-xs">
        <FOOTNOTE className="font-medium text-default">AI Assistant</FOOTNOTE>
        <div className="mt-1 space-y-3 text-xs text-secondary">
          I'm an SDK AI assistant — ask me a question about the{' '}
          <span className="font-medium text-default">
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
        const isFallbackAnswer = trimmedAnswer === fallbackResponse;
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

        return (
          <div key={qa.id ?? `${qa.question}-${index}`} className="space-y-2">
            {markers.map(marker => (
              <div key={`marker-${marker.id}`} className="flex justify-center">
                <FOOTNOTE
                  theme="secondary"
                  className="inline-block rounded-md border border-default bg-subtle px-2 py-1">
                  Switched to <span className="font-medium text-default">{marker.label}.</span>
                </FOOTNOTE>
              </div>
            ))}
            <div className="flex justify-end pr-1">
              <div className="ml-auto max-w-[85%] rounded-md border border-default bg-subtle px-3 py-1.5 text-right text-sm leading-snug text-secondary shadow-xs">
                {displayQuestion}
              </div>
            </div>
            <div className="px-0">
              <FOOTNOTE className="font-medium text-default">AI Assistant</FOOTNOTE>
              <div className="mt-1 space-y-3 text-xs text-secondary">
                {normalizedAnswer ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {normalizedAnswer}
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
                    className="inline-flex items-center gap-2 rounded-md border border-default bg-subtle px-3 py-1 text-xs font-medium text-default shadow-xs transition-colors hover:bg-element focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-blue9 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isBusy || hasTriggeredGlobalSearch || isPendingGlobal}
                    onClick={() => {
                      onSearchAcrossDocs(displayQuestion);
                    }}>
                    <FileSearch02Icon className="icon-xs text-icon-secondary" />
                    {hasTriggeredGlobalSearch || isPendingGlobal
                      ? 'Searching Expo docs…'
                      : 'Search Expo docs'}
                  </Button>
                  {showSwitchingNotice ? (
                    <FOOTNOTE theme="secondary" className="text-xs">
                      {switchNoticeText}
                    </FOOTNOTE>
                  ) : null}
                </div>
              ) : null}
            </div>
            {qa.sources?.length ? (
              <FOOTNOTE theme="secondary" className="ml-1 text-xs">
                Sources:{' '}
                {qa.sources.map((source, sourceIdx, sources) => (
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
            className="inline-block rounded-md border border-default bg-subtle px-2 py-1">
            Switched to <span className="font-medium text-default">{marker.label}.</span>
          </FOOTNOTE>
        </div>
      ))}
    </div>
  );
}
