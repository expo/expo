import { Button, mergeClasses } from '@expo/styleguide';
import { Stars03DuotoneIcon } from '@expo/styleguide-icons/duotone/Stars03DuotoneIcon';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import { RefreshCcw02Icon } from '@expo/styleguide-icons/outline/RefreshCcw02Icon';
import { Send03Icon } from '@expo/styleguide-icons/outline/Send03Icon';
import { ThumbsDownIcon } from '@expo/styleguide-icons/outline/ThumbsDownIcon';
import { ThumbsUpIcon } from '@expo/styleguide-icons/outline/ThumbsUpIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { useChat, type Reaction } from '@kapaai/react-sdk';
import {
  Children,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { FOOTNOTE } from '../Text';

type AskPageAIChatProps = {
  onClose: () => void;
  onMinimize?: () => void;
  pageTitle?: string;
};

type ConversationKey = string | null;

export function AskPageAIChat({ onClose, onMinimize, pageTitle }: AskPageAIChatProps) {
  const {
    conversation,
    submitQuery,
    isGeneratingAnswer,
    isPreparingAnswer,
    error,
    resetConversation,
    stopGeneration,
    addFeedback,
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

  const feedbackTarget = useMemo(() => {
    for (let index = conversation.length - 1; index >= 0; index -= 1) {
      const entry = conversation[index];
      if (
        entry &&
        entry.id &&
        'isFeedbackSubmissionEnabled' in entry &&
        entry.isFeedbackSubmissionEnabled
      ) {
        return entry;
      }
    }
    return null;
  }, [conversation]);
  const buildPrompt = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.href : '';
    return (text: string) =>
      [
        'You are ExpoDocsExpert, an assistant who answers questions strictly using the supplied Expo SDK documentation context.',
        `The user is reading the Expo docs page titled "${contextLabel}" at ${origin || 'the latest Expo SDK docs'}.`,
        'Only rely on the provided context. If the answer is missing, respond exactly with: "I couldn\'t find that on this page."',
        'Prefer concise explanations, reference relevant APIs or headings, and format instructions as short steps or bullet lists when helpful.',
        'Whenever you share code or configuration examples, return complete, ready-to-run snippets with all required imports and setup so the user can copy and paste them into their app without additional context.',
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

  const handleConversationReset = useCallback(() => {
    if (isBusy && conversation.length > 0) {
      stopGeneration();
    }
    resetConversation();
    setQuestion('');
    setAskedQuestions([]);
  }, [conversation.length, isBusy, resetConversation, stopGeneration]);

  const handleFeedback = useCallback(
    (reaction: Reaction) => {
      if (!feedbackTarget || !feedbackTarget.isFeedbackSubmissionEnabled) {
        return;
      }
      if (feedbackTarget.reaction === reaction) {
        return;
      }
      addFeedback(feedbackTarget.id, reaction);
    },
    [addFeedback, feedbackTarget]
  );

  const handleNavigation = useCallback(
    (event?: MouseEvent<HTMLAnchorElement>) => {
      if (event?.defaultPrevented) {
        return;
      }
      onMinimize?.();
    },
    [onMinimize]
  );

  const markdownComponents = useMemo(() => {
    return {
      code({
        inline,
        children,
      }: {
        inline?: boolean;
        children?: React.ReactNode;
        className?: string;
      }) {
        const childArray = Children.toArray(children);
        const raw = childArray.map(node => (typeof node === 'string' ? node : '')).join('');
        const clean = raw.replace(/\n$/, '');

        const tokenCount = clean.trim().split(/\s+/).length;
        const hasLineBreak = clean.includes('\n');

        if (inline) {
          const trimmed = clean.replace(/^`+/, '').replace(/`+$/, '');
          const display = trimmed.length > 0 ? trimmed : clean;
          const shouldRenderInline = display.trim().split(/\s+/).length <= 1;

          if (shouldRenderInline) {
            return (
              <code className="rounded bg-subtle px-1 py-0.5 text-xs text-default">{display}</code>
            );
          }

          return <MarkdownCodeBlock code={display.trim()} compact />;
        }

        if (!hasLineBreak && tokenCount <= 1) {
          return (
            <code className="rounded bg-subtle px-1 py-0.5 text-xs text-default">
              {clean.trim()}
            </code>
          );
        }

        return <MarkdownCodeBlock code={clean} />;
      },
      a({ children, href, ...rest }) {
        return (
          <a
            {...rest}
            href={href ?? '#'}
            className={mergeClasses('text-link', rest.className)}
            onClick={event => {
              rest.onClick?.(event);
              if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.button !== 0) {
                return;
              }
              handleNavigation(event);
            }}>
            {children}
          </a>
        );
      },
    } as Components;
  }, [handleNavigation]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-default">
      <div className="flex items-center justify-between border-b border-default bg-palette-black px-4 py-3 text-palette-white">
        <div className="flex items-center">
          <span
            className={mergeClasses(
              'inline-flex size-8 items-center justify-center rounded-full bg-palette-white shadow-xs'
            )}
            style={headerAccentBackground}>
            <Stars03DuotoneIcon className="icon-sm text-palette-white" />
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
              ...(feedbackTarget?.reaction === 'upvote' ? activeFeedbackBackground : null),
            }}
            aria-pressed={feedbackTarget?.reaction === 'upvote'}
            disabled={!feedbackTarget?.isFeedbackSubmissionEnabled}
            onClick={() => {
              handleFeedback('upvote');
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
              ...(feedbackTarget?.reaction === 'downvote' ? activeFeedbackBackground : null),
            }}
            aria-pressed={feedbackTarget?.reaction === 'downvote'}
            disabled={!feedbackTarget?.isFeedbackSubmissionEnabled}
            onClick={() => {
              handleFeedback('downvote');
            }}>
            <ThumbsDownIcon className="icon-xs text-palette-white" />
          </Button>
          <Button
            type="button"
            aria-label="Reset conversation"
            theme="quaternary"
            size="xs"
            className="px-2 !text-palette-white hover:!text-palette-white focus:!text-palette-white"
            style={closeButtonThemeOverrides}
            onClick={handleConversationReset}>
            <RefreshCcw02Icon className="icon-xs text-palette-white" />
          </Button>
          <Button
            aria-label="Close Ask AI assistant"
            theme="quaternary"
            size="xs"
            className="px-2 !text-palette-white hover:!text-palette-white focus:!text-palette-white"
            style={closeButtonThemeOverrides}
            onClick={handleClose}>
            <XIcon className="icon-sm text-palette-white" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {conversation.length > 0 ? (
          <div className="space-y-5">
            {conversation.map((qa, index) => {
              const isLast = index === conversation.length - 1;
              const key = (qa.id as ConversationKey) ?? `${qa.question}-${index}`;
              const displayQuestion = askedQuestions[index] ?? qa.question;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-end pr-1">
                    <div className="ml-auto max-w-[85%] rounded-md border border-default bg-subtle px-3 py-1.5 text-right text-sm leading-snug text-secondary shadow-xs">
                      {displayQuestion}
                    </div>
                  </div>
                  <div className="rounded-md border border-default bg-subtle px-3 py-2 shadow-xs">
                    <FOOTNOTE className="font-medium text-default">AI Assistant</FOOTNOTE>
                    <div className="prose prose-sm mt-1 text-secondary dark:prose-invert prose-a:text-link prose-pre:!bg-transparent">
                      {qa.answer ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {qa.answer}
                        </ReactMarkdown>
                      ) : (
                        <FOOTNOTE theme="secondary">
                          {isLast && isBusy ? 'Preparing answer...' : ''}
                        </FOOTNOTE>
                      )}
                    </div>
                  </div>
                  {qa.sources?.length ? (
                    <FOOTNOTE theme="secondary" className="ml-1 text-xs">
                      Sources:{' '}
                      {qa.sources.map((source, sourceIdx) => (
                        <span key={source.source_url}>
                          <a
                            className="text-link"
                            href={source.source_url}
                            onClick={event => {
                              if (event.metaKey || event.ctrlKey || event.button !== 0) {
                                return;
                              }
                              handleNavigation(event);
                            }}>
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

      <div className="mt-auto border-t border-default px-5 pb-6 pt-4">
        <form
          className="flex items-center gap-1 rounded-md border border-default bg-default px-2 py-1.5"
          onSubmit={handleSubmit}
          aria-label="Ask AI form">
          <textarea
            aria-label="Ask AI about this page"
            className="min-h-[72px] flex-1 resize-none rounded-md border border-transparent bg-subtle p-2 text-sm leading-relaxed outline-none"
            rows={3}
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
            className="flex size-6 items-center justify-center rounded-full !p-0"
            disabled={isBusy || question.trim().length === 0}>
            <Send03Icon className="icon-xs text-icon-default" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MarkdownCodeBlock({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [copied]);

  const handleCopyAsync = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (error) {
      console.error('Unable to copy code snippet', error);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-md border border-default bg-subtle">
      <button
        type="button"
        className="bg-default/90 absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full text-secondary shadow-sm transition hover:bg-default"
        onClick={handleCopyAsync}>
        <span className="sr-only">Copy code</span>
        {copied ? (
          <CheckIcon className="icon-xs text-success" aria-hidden />
        ) : (
          <ClipboardIcon className="icon-xs text-icon-secondary" aria-hidden />
        )}
      </button>
      <pre
        className={mergeClasses(
          'overflow-x-auto whitespace-pre bg-transparent text-xs leading-relaxed text-default',
          compact ? 'px-3 py-1' : 'px-3 py-1.5'
        )}>
        <code className="block whitespace-pre text-default">{code}</code>
      </pre>
    </div>
  );
}
