import { Button, mergeClasses } from '@expo/styleguide';
import { Stars03DuotoneIcon } from '@expo/styleguide-icons/duotone/Stars03DuotoneIcon';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import { Maximize02Icon } from '@expo/styleguide-icons/outline/Maximize02Icon';
import { Minimize02Icon } from '@expo/styleguide-icons/outline/Minimize02Icon';
import { RefreshCcw02Icon } from '@expo/styleguide-icons/outline/RefreshCcw02Icon';
import { Send03Icon } from '@expo/styleguide-icons/outline/Send03Icon';
import { ThumbsDownIcon } from '@expo/styleguide-icons/outline/ThumbsDownIcon';
import { ThumbsUpIcon } from '@expo/styleguide-icons/outline/ThumbsUpIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { useChat, type Reaction } from '@kapaai/react-sdk';
import {
  type AnchorHTMLAttributes,
  type ComponentType,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cleanCopyValue, getCodeBlockDataFromChildren } from '~/common/code-utilities';
import { markdownComponents as docsMarkdownComponents } from '~/ui/components/Markdown';

import { FOOTNOTE } from '../Text';

type AskPageAIChatProps = {
  onClose: () => void;
  onMinimize?: () => void;
  pageTitle?: string;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  isExpoSdkPage?: boolean;
};

type ConversationKey = string | null;

export function AskPageAIChat({
  onClose,
  onMinimize,
  pageTitle,
  onToggleExpand,
  isExpanded = false,
  isExpoSdkPage = false,
}: AskPageAIChatProps) {
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
  const displayContextLabel = useMemo(() => {
    const label = contextLabel.trim();
    if (!isExpoSdkPage) {
      return label;
    }
    const lower = label.toLowerCase();
    if (lower === 'expo' || lower.startsWith('expo ')) {
      return label;
    }
    return `Expo ${label}`;
  }, [contextLabel, isExpoSdkPage]);
  const [question, setQuestion] = useState('');
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  const extractUserQuestion = useCallback((fullPrompt: string, fallback: string) => {
    const marker = 'User question:';
    const markerIndex = fullPrompt.lastIndexOf(marker);
    if (markerIndex === -1) {
      return fallback;
    }
    return fullPrompt.slice(markerIndex + marker.length).trim();
  }, []);

  useEffect(() => {
    if (conversation.length === 0 && askedQuestions.length > 0) {
      setAskedQuestions([]);
    }
  }, [conversation.length, askedQuestions.length]);

  useEffect(() => {
    if (conversation.length <= askedQuestions.length) {
      return;
    }
    setAskedQuestions(prev => {
      const next = [...prev];
      for (let index = prev.length; index < conversation.length; index += 1) {
        const qa = conversation[index];
        next[index] = extractUserQuestion(qa.question, qa.question);
      }
      return next;
    });
  }, [conversation, askedQuestions.length, extractUserQuestion]);

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
        'You are ExpoDocsExpert, an assistant that must answer strictly using the supplied Expo SDK documentation context.',
        `The user is reading the Expo docs page titled "${contextLabel}" at ${origin || 'the latest Expo SDK docs'}.`,
        'You only have access to the content from this page. You do not have access to other pages, past answers, or external knowledge.',
        'Before responding, confirm that every sentence in your answer is directly supported by the provided context.',
        'If you cannot confirm this support, respond exactly with: "I couldn\'t find that on this page." Do not explain or apologize.',
        'If the question is unrelated to the provided context, respond exactly with: "I couldn\'t find that on this page."',
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
    setQuestion('');
    setAskedQuestions([]);
    resetConversation();
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

  const markdownComponents = useMemo<Components>(() => {
    const AnchorComponent =
      (docsMarkdownComponents.a as ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>) ?? 'a';
    const ParagraphComponent = (docsMarkdownComponents.p as ComponentType<any>) ?? 'p';
    const OrderedListComponent = (docsMarkdownComponents.ol as ComponentType<any>) ?? 'ol';
    const UnorderedListComponent = (docsMarkdownComponents.ul as ComponentType<any>) ?? 'ul';
    const ListItemComponent = (docsMarkdownComponents.li as ComponentType<any>) ?? 'li';
    const Heading1Component = (docsMarkdownComponents.h1 as ComponentType<any>) ?? 'h1';
    const Heading2Component = (docsMarkdownComponents.h2 as ComponentType<any>) ?? 'h2';
    const Heading3Component = (docsMarkdownComponents.h3 as ComponentType<any>) ?? 'h3';
    const Heading4Component = (docsMarkdownComponents.h4 as ComponentType<any>) ?? 'h4';
    const Heading5Component = (docsMarkdownComponents.h5 as ComponentType<any>) ?? 'h5';
    const PreComponent = (docsMarkdownComponents.pre as ComponentType<any>) ?? 'pre';

    const ChatPre: ComponentType<any> = preProps => {
      const { value } = useMemo(
        () => getCodeBlockDataFromChildren(preProps.children, preProps.className),
        [preProps.children, preProps.className]
      );
      const codeToCopy = useMemo(() => cleanCopyValue(value ?? ''), [value]);
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

      const handleCopy = () => {
        if (!codeToCopy) {
          return;
        }
        void navigator.clipboard?.writeText(codeToCopy);
        setCopied(true);
      };

      return (
        <div className="relative">
          <PreComponent {...preProps} className={mergeClasses('px-3 py-2', preProps.className)} />
          <Button
            type="button"
            theme="quaternary"
            size="xs"
            className="pointer-events-auto absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full !border !border-default !bg-default !p-0 shadow-sm"
            onClick={handleCopy}
            aria-label="Copy code block">
            {copied ? (
              <CheckIcon className="icon-xs text-success" aria-hidden />
            ) : (
              <ClipboardIcon className="icon-xs text-icon-secondary" aria-hidden />
            )}
          </Button>
        </div>
      );
    };

    return {
      ...docsMarkdownComponents,
      h1: props => (
        <Heading1Component
          {...props}
          className={mergeClasses('!text-[14px] font-semibold text-default', props.className)}
        />
      ),
      h2: props => (
        <Heading2Component
          {...props}
          className={mergeClasses('!text-[14px] font-semibold text-default', props.className)}
        />
      ),
      h3: props => (
        <Heading3Component
          {...props}
          className={mergeClasses('!text-[12px] font-semibold text-default', props.className)}
        />
      ),
      h4: props => (
        <Heading4Component
          {...props}
          className={mergeClasses('!text-[12px] font-semibold text-default', props.className)}
        />
      ),
      h5: props => (
        <Heading5Component
          {...props}
          className={mergeClasses('!text-[10px] font-semibold text-default', props.className)}
        />
      ),
      p: ({ className, style, ...rest }) => (
        <ParagraphComponent
          {...rest}
          style={{ ...(style ?? {}), fontSize: '14px', lineHeight: '1.5' }}
          className={mergeClasses(
            '!mb-2 text-secondary',
            className,
            '!text-[10px] !leading-[1.55]'
          )}
        />
      ),
      ol: ({ className, style, ...rest }) => (
        <OrderedListComponent
          {...rest}
          style={{ ...(style ?? {}), fontSize: '14px', lineHeight: '1.5' }}
          className={mergeClasses('text-secondary', className, '!text-[10px] leading-normal')}
        />
      ),
      ul: ({ className, style, ...rest }) => (
        <UnorderedListComponent
          {...rest}
          style={{ ...(style ?? {}), fontSize: '14px', lineHeight: '1.5' }}
          className={mergeClasses('text-secondary', className, '!text-[10px] leading-normal')}
        />
      ),
      li: ({ className, style, ...rest }) => (
        <ListItemComponent
          {...rest}
          style={{ ...(style ?? {}), fontSize: '14px', lineHeight: '1.45' }}
          className={mergeClasses('text-secondary', className, '!text-[10px] !leading-[1.45]')}
        />
      ),
      sup: ({ children, className, ...supProps }: any) => (
        <span
          {...supProps}
          className={mergeClasses('align-baseline !text-[10px] text-secondary', className)}>
          [{children}]
        </span>
      ),
      a: ({
        href,
        children,
        onClick: originalOnClick,
        ...props
      }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <AnchorComponent
          {...props}
          href={href ?? '#'}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            originalOnClick?.(event);
            if (
              event.defaultPrevented ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.button !== 0
            ) {
              return;
            }
            handleNavigation(event);
          }}>
          {children}
        </AnchorComponent>
      ),
      pre: ChatPre,
    } as Components;
  }, [handleNavigation]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-default">
      <div className="flex flex-col gap-3 border-b border-default bg-palette-black px-4 py-3 text-palette-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
                ...(feedbackTarget?.reaction === 'upvote' ? activeFeedbackBackground : {}),
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
                ...(feedbackTarget?.reaction === 'downvote' ? activeFeedbackBackground : {}),
              }}
              aria-pressed={feedbackTarget?.reaction === 'downvote'}
              disabled={!feedbackTarget?.isFeedbackSubmissionEnabled}
              onClick={() => {
                handleFeedback('downvote');
              }}>
              <ThumbsDownIcon className="icon-xs text-palette-white" />
            </Button>
            {onToggleExpand ? (
              <Button
                type="button"
                aria-label={
                  isExpanded ? 'Restore Ask AI assistant size' : 'Expand Ask AI assistant'
                }
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
              <XIcon className="icon-xs text-palette-white" />
            </Button>
          </div>
        </div>
        <FOOTNOTE className="text-palette-white">
          Ask a question about <span className="font-semibold">{displayContextLabel}</span>.
        </FOOTNOTE>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {conversation.length > 0 ? (
          <div className="space-y-5">
            {conversation.map((qa, index) => {
              const isLast = index === conversation.length - 1;
              const key = (qa.id as ConversationKey) ?? `${qa.question}-${index}`;
              const displayQuestion =
                askedQuestions[index] ?? extractUserQuestion(qa.question, qa.question);
              const normalizedAnswer = qa.answer?.replace(/<br\s*\/?>(\n)?/gi, '\n');

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-end pr-1">
                    <div className="ml-auto max-w-[85%] rounded-md border border-default bg-subtle px-3 py-1.5 text-right text-sm leading-snug text-secondary shadow-xs">
                      {displayQuestion}
                    </div>
                  </div>
                  <div className="rounded-md border border-default bg-subtle px-3 py-2 shadow-xs">
                    <FOOTNOTE className="font-medium text-default">AI Assistant</FOOTNOTE>
                    <div className="mt-1 space-y-3 text-xs text-secondary">
                      {normalizedAnswer ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {normalizedAnswer}
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
          <div className="rounded-md border border-default bg-subtle px-3 py-2 shadow-xs">
            <FOOTNOTE className="font-medium text-default">AI Assistant</FOOTNOTE>
            <div className="mt-1 space-y-3 text-xs text-secondary">
              I'm an SDK AI assistant — ask me a question about the{' '}
              <span className="font-medium text-default">{displayContextLabel}</span> page.
            </div>
          </div>
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
            className="min-h-[72px] flex-1 resize-none rounded-md border border-transparent bg-subtle p-2 text-sm leading-relaxed outline-none focus:!shadow-none focus:!outline-none focus:ring-0 focus-visible:!shadow-none focus-visible:!outline-none focus-visible:ring-0"
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
