import { Button, mergeClasses } from '@expo/styleguide';
import { Stars03DuotoneIcon } from '@expo/styleguide-icons/duotone/Stars03DuotoneIcon';
import { Send03Icon } from '@expo/styleguide-icons/outline/Send03Icon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { useChat } from '@kapaai/react-sdk';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { FOOTNOTE, RawH5 } from '../Text';

type AskPageAIChatProps = {
  onClose: () => void;
  pageTitle?: string;
};

type ConversationKey = string | null;

export function AskPageAIChat({ onClose, pageTitle }: AskPageAIChatProps) {
  const {
    conversation,
    submitQuery,
    isGeneratingAnswer,
    isPreparingAnswer,
    error,
    resetConversation,
    stopGeneration,
  } = useChat();

  const contextLabel = pageTitle?.trim() ? pageTitle : 'This page';
  const [question, setQuestion] = useState('');
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const previousTitleRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousTitleRef.current !== pageTitle) {
      previousTitleRef.current = pageTitle;
      resetConversation();
      setQuestion('');
      setAskedQuestions([]);
    }
  }, [pageTitle, resetConversation]);

  useEffect(() => {
    if (conversation.length === 0 && askedQuestions.length > 0) {
      setAskedQuestions([]);
    }
  }, [conversation.length, askedQuestions.length]);

  const isBusy = isPreparingAnswer || isGeneratingAnswer;
  const buildPrompt = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.href : '';
    return (text: string) =>
      [
        'You are ExpoDocsExpert, an assistant who answers questions strictly using the supplied Expo SDK documentation context.',
        `The user is reading the Expo docs page titled "${contextLabel}" at ${origin || 'the latest Expo SDK docs'}.`,
        'Only rely on the provided context. If the answer is missing, respond exactly with: "I couldn\'t find that on this page."',
        'Prefer concise explanations, reference relevant APIs or headings, and format instructions as short steps or bullet lists when helpful.',
        'Mention the Expo SDK version when relevant (this context represents the "latest" docs).',
        '',
        `User question: ${text}`,
      ].join('\n');
  }, [contextLabel]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }
    submitQuery(buildPrompt(trimmed));
    setAskedQuestions(prev => [...prev, trimmed]);
    setQuestion('');
  };

  const handleClose = () => {
    if ((isGeneratingAnswer || isPreparingAnswer) && conversation.length > 0) {
      stopGeneration();
    }
    onClose();
  };

  return (
    <div className="flex h-full flex-col bg-default">
      <div className="flex items-center justify-between border-b border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={mergeClasses(
              'inline-flex size-8 items-center justify-center rounded-full bg-element shadow-xs'
            )}>
            <Stars03DuotoneIcon className="icon-sm text-icon-default" />
          </span>
          <RawH5 className="!my-0">AI Assistant</RawH5>
        </div>
        <Button
          aria-label="Close Ask AI assistant"
          theme="quaternary"
          size="xs"
          className="px-2"
          onClick={handleClose}>
          <XIcon className="icon-xs text-icon-secondary" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {conversation.length > 0 ? (
          <div className="space-y-5">
            {conversation.map((qa, index) => {
              const isLast = index === conversation.length - 1;
              const key = (qa.id as ConversationKey) ?? `${qa.question}-${index}`;
              const displayQuestion = askedQuestions[index] ?? qa.question;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-start justify-end pr-1">
                    <span className="bg-link/10 inline-flex rounded-full px-3 py-1 text-link">
                      {displayQuestion}
                    </span>
                  </div>
                  <div className="rounded-md border border-default bg-subtle px-3 py-2 shadow-xs">
                    <FOOTNOTE className="font-medium text-default">AI Assistant</FOOTNOTE>
                    <FOOTNOTE theme="secondary" className="mt-1">
                      {qa.answer || (isLast && isBusy ? 'Thinking…' : '')}
                    </FOOTNOTE>
                  </div>
                  {qa.sources?.length ? (
                    <FOOTNOTE theme="secondary" className="ml-1 text-xs">
                      Sources:{' '}
                      {qa.sources.map((source, sourceIdx) => (
                        <span key={source.source_url}>
                          <a
                            className="text-link"
                            href={source.source_url}
                            target="_blank"
                            rel="noreferrer">
                            {source.title || `Source ${sourceIdx + 1}`}
                          </a>
                          {sourceIdx < qa.sources.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </FOOTNOTE>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <FOOTNOTE theme="secondary">Ask a question about {contextLabel}.</FOOTNOTE>
        )}
        {error && (
          <FOOTNOTE theme="danger" className="mt-4">
            {error}
          </FOOTNOTE>
        )}
      </div>

      <div className="mt-auto border-t border-default px-4 pb-5 pt-4">
        <form
          className="flex items-center gap-3 rounded-full border border-default bg-default px-5 py-2 shadow-xs"
          onSubmit={handleSubmit}
          aria-label="Ask AI form">
          <textarea
            aria-label="Ask AI about this page"
            className="min-h-[38px] flex-1 resize-none bg-transparent text-sm text-default outline-none"
            rows={1}
            value={question}
            onChange={event => {
              setQuestion(event.target.value);
            }}
            disabled={isBusy && conversation.length === 0}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button
            type="submit"
            theme="quaternary"
            size="sm"
            className="flex size-9 items-center justify-center rounded-full !p-0"
            disabled={isBusy || question.trim().length === 0}>
            <Send03Icon className="icon-sm text-icon-default" />
          </Button>
        </form>
      </div>
    </div>
  );
}
