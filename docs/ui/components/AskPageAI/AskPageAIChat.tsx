import { useChat } from '@kapaai/react-sdk';
import { useRouter } from 'next/compat/router';
import {
  type FormEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { usePageMetadata } from '~/providers/page-metadata';

import { FOOTNOTE } from '../Text';
import type {
  ContextMarker,
  ContextScope,
  FeedbackTarget,
  GlobalSwitchStatus,
} from './AskPageAIChat.types';
import { createMarkerMap, normalizeQuestion } from './AskPageAIChat.utils';
import { AskPageAIChatHeader } from './AskPageAIChatHeader';
import { AskPageAIChatInput } from './AskPageAIChatInput';
import { AskPageAIChatMessages } from './AskPageAIChatMessages';
import { useChatMarkdownComponents } from './useChatMarkdownComponents';

type AskPageAIChatProps = {
  onClose: () => void;
  onMinimize?: () => void;
  pageTitle?: string;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  isExpoSdkPage?: boolean;
};

const FALLBACK_TEMPLATE = (label: string) =>
  `I can only answer questions about the current ${label} documentation.`;
const DEFAULT_CONTEXT_LABEL = 'This page';

const buildDisplayContextLabel = (label: string, shouldPrefixExpo: boolean) => {
  const trimmed = label.trim();
  if (!trimmed) {
    return DEFAULT_CONTEXT_LABEL;
  }
  if (!shouldPrefixExpo) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'expo') {
    return trimmed;
  }
  return `Expo ${trimmed}`;
};

export function AskPageAIChat({
  onClose,
  onMinimize,
  pageTitle,
  onToggleExpand,
  isExpanded = false,
  isExpoSdkPage = false,
}: AskPageAIChatProps) {
  const router = useRouter();
  const pageMetadata = usePageMetadata();
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

  const basePath = (router?.asPath ?? '').split('#')[0];
  const providedTitle = pageTitle?.trim() ?? '';
  const metadataTitle = pageMetadata?.title?.trim() ?? '';
  const contextLabel =
    (providedTitle || metadataTitle || DEFAULT_CONTEXT_LABEL).trim() || DEFAULT_CONTEXT_LABEL;

  const shouldPrefixExpo =
    typeof isExpoSdkPage === 'boolean'
      ? isExpoSdkPage
      : basePath.startsWith('/versions/latest/sdk/');

  const displayContextLabel = useMemo(
    () => buildDisplayContextLabel(contextLabel, shouldPrefixExpo),
    [contextLabel, shouldPrefixExpo]
  );

  const fallbackResponse = useMemo(
    () => FALLBACK_TEMPLATE(displayContextLabel),
    [displayContextLabel]
  );

  const [contextScope, setContextScope] = useState<ContextScope>('page');
  const [question, setQuestion] = useState('');
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [contextMarkers, setContextMarkers] = useState<ContextMarker[]>([]);
  const [globalSearchRequests, setGlobalSearchRequests] = useState<Record<string, boolean>>({});
  const [globalSwitchNotices, setGlobalSwitchNotices] = useState<
    Record<string, GlobalSwitchStatus>
  >({});
  const [pendingGlobalQuestionKey, setPendingGlobalQuestionKey] = useState<string | null>(null);

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

  const resetLocalState = useCallback(
    (options: { resetConversation?: boolean; clearMarkers?: boolean } = {}) => {
      const { resetConversation: shouldResetConversation = false, clearMarkers = true } = options;
      setQuestion('');
      setAskedQuestions([]);
      if (clearMarkers) {
        setContextMarkers([]);
      }
      setGlobalSearchRequests({});
      setGlobalSwitchNotices({});
      setPendingGlobalQuestionKey(null);
      setContextScope('page');
      if (shouldResetConversation) {
        resetConversation();
      }
    },
    [resetConversation]
  );

  useEffect(() => {
    if (conversation.length === 0 && contextScope !== 'page') {
      resetLocalState();
    }
  }, [conversation.length, contextScope, resetLocalState]);

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const prevDisplayContextRef = useRef<string>(displayContextLabel);
  const prevBasePathRef = useRef<string | null>(null);

  useEffect(() => {
    const prevPath = prevBasePathRef.current;
    const prevLabel = prevDisplayContextRef.current;
    const pathChanged = Boolean(prevPath && prevPath !== basePath);
    const labelChanged = Boolean(prevLabel && prevLabel !== displayContextLabel);

    if (pathChanged || labelChanged) {
      if (conversation.length > 0) {
        stopGeneration();
        resetLocalState({ resetConversation: true });
      } else {
        resetLocalState();
      }
    }

    prevBasePathRef.current = basePath;
    prevDisplayContextRef.current = displayContextLabel;
  }, [basePath, conversation.length, displayContextLabel, resetLocalState, stopGeneration]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedPath = window.sessionStorage.getItem('expo-docs-ask-ai-last-path');
    if (storedPath && storedPath !== basePath && conversation.length > 0) {
      setContextMarkers(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          at: conversation.length,
          label: displayContextLabel,
        },
      ]);
    }
    window.sessionStorage.setItem('expo-docs-ask-ai-last-path', basePath);
  }, [basePath, displayContextLabel, conversation.length]);

  const lastEntry = conversation.at(-1);
  const lastEntryKey = `${conversation.length}-${lastEntry?.id ?? 'noid'}-${
    lastEntry?.answer?.length ?? 0
  }`;

  useEffect(() => {
    window.requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [contextMarkers.length, lastEntryKey, scrollToBottom]);

  useEffect(() => {
    if (!pendingGlobalQuestionKey) {
      return;
    }
    const match = conversation.find(qa => {
      const normalizedAnswer = qa.answer
        ?.replace(/<br\s*\/?>((\n)?)/gi, '\n')
        ?.replace(/<sup[^>]*>(.*?)<\/sup>/gi, '$1')
        ?.trim();
      const normalizedQuestion = normalizeQuestion(extractUserQuestion(qa.question, qa.question));
      if (normalizedQuestion !== pendingGlobalQuestionKey) {
        return false;
      }
      if (!normalizedAnswer || normalizedAnswer.length === 0) {
        return false;
      }
      return normalizedAnswer !== fallbackResponse;
    });

    if (match) {
      setGlobalSearchRequests(prev => {
        const next = { ...prev };
        delete next[pendingGlobalQuestionKey];
        return next;
      });
      setGlobalSwitchNotices(prev => {
        if (!prev[pendingGlobalQuestionKey]) {
          return prev;
        }
        return { ...prev, [pendingGlobalQuestionKey]: 'done' };
      });
      setPendingGlobalQuestionKey(null);
    }
  }, [conversation, extractUserQuestion, fallbackResponse, pendingGlobalQuestionKey]);

  const markersByIndex = useMemo(() => createMarkerMap(contextMarkers), [contextMarkers]);

  const isBusy = isPreparingAnswer || isGeneratingAnswer;

  const feedbackTarget = useMemo<FeedbackTarget>(() => {
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

  const buildPrompt = useCallback(
    (text: string, overrideScope?: ContextScope) => {
      const scope = overrideScope ?? contextScope;
      if (scope === 'global') {
        return [
          'You are ExpoDocsExpert, an assistant that can search across the entire Expo documentation set before answering.',
          'Use Search Ask AI as needed, gather any relevant context from other pages, and verify that each part of your response is supported.',
          'Prefer concise explanations with references to specific APIs or headings, and mention the Expo SDK version when it helps.',
          '',
          `User question: ${text}`,
        ].join('\n');
      }
      const origin = typeof window !== 'undefined' ? window.location.href : '';
      return [
        'You are ExpoDocsExpert, an assistant that must answer strictly using the supplied Expo SDK documentation context.',
        `The user is reading the Expo docs page titled "${contextLabel}" at ${origin || 'the latest Expo SDK docs'}.`,
        'You only have access to the content from this page. You do not have access to other pages, past answers, or external knowledge.',
        'Before responding, confirm that every sentence in your answer is directly supported by the provided context.',
        `If you cannot confirm this support, respond exactly with: "${fallbackResponse}" Do not explain or apologize.`,
        `If the question is unrelated to the provided context, respond exactly with: "${fallbackResponse}"`,
        'Prefer concise explanations, reference relevant APIs or headings, and format instructions as short steps or bullet lists when helpful.',
        'Whenever you share code or configuration examples, return complete, ready-to-run snippets with all required imports and setup so the user can copy and paste them into their app without additional context.',
        'Mention the Expo SDK version when relevant (this context represents the "latest" docs).',
        '',
        `User question: ${text}`,
      ].join('\n');
    },
    [contextLabel, contextScope, fallbackResponse]
  );

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
    resetLocalState({ resetConversation: true });
  }, [conversation.length, isBusy, resetLocalState, stopGeneration]);

  const handleFeedback = useCallback(
    (reaction: 'upvote' | 'downvote') => {
      if (!feedbackTarget?.isFeedbackSubmissionEnabled) {
        return;
      }
      if (feedbackTarget.reaction === reaction) {
        return;
      }
      addFeedback(feedbackTarget.id!, reaction);
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

  const handleSearchAcrossDocs = useCallback(
    (questionText: string) => {
      const trimmed = questionText.trim();
      if (!trimmed) {
        return;
      }
      const questionKey = normalizeQuestion(trimmed);
      if (isBusy || globalSearchRequests[questionKey]) {
        return;
      }
      setContextScope('global');
      setGlobalSearchRequests(prev => ({ ...prev, [questionKey]: true }));
      setGlobalSwitchNotices(prev => ({ ...prev, [questionKey]: 'pending' }));
      setPendingGlobalQuestionKey(questionKey);
      setContextMarkers(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          at: conversation.length,
          label: 'Expo docs context',
        },
      ]);
      submitQuery(buildPrompt(trimmed, 'global'));
      setAskedQuestions(prev => [...prev, trimmed]);
    },
    [buildPrompt, conversation.length, globalSearchRequests, isBusy, submitQuery]
  );

  const handleSwitchBackToPageContext = useCallback(() => {
    if (contextScope !== 'global') {
      return;
    }

    setContextScope('page');
    if (pendingGlobalQuestionKey) {
      setGlobalSearchRequests(prev => {
        if (!(pendingGlobalQuestionKey in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[pendingGlobalQuestionKey];
        return next;
      });
      setGlobalSwitchNotices(prev => {
        if (!prev[pendingGlobalQuestionKey]) {
          return prev;
        }
        return { ...prev, [pendingGlobalQuestionKey]: 'done' };
      });
      setPendingGlobalQuestionKey(null);
    }
    setContextMarkers(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        at: conversation.length,
        label: displayContextLabel,
      },
    ]);
  }, [contextScope, conversation.length, displayContextLabel, pendingGlobalQuestionKey]);

  const markdownComponents = useChatMarkdownComponents({ onNavigate: handleNavigation });

  const messageEntries = useMemo(
    () =>
      conversation.map(qa => ({
        id: qa.id ?? null,
        question: qa.question,
        answer: qa.answer,
        sources: qa.sources,
        isFeedbackSubmissionEnabled:
          'isFeedbackSubmissionEnabled' in qa ? qa.isFeedbackSubmissionEnabled : undefined,
      })),
    [conversation]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-default">
      <AskPageAIChatHeader
        displayContextLabel={displayContextLabel}
        contextScope={contextScope}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onSwitchToPageContext={handleSwitchBackToPageContext}
        onReset={handleConversationReset}
        onClose={handleClose}
        feedbackTarget={feedbackTarget}
        onFeedback={handleFeedback}
      />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <AskPageAIChatMessages
          conversation={messageEntries}
          askedQuestions={askedQuestions}
          fallbackResponse={fallbackResponse}
          contextScope={contextScope}
          globalSearchRequests={globalSearchRequests}
          globalSwitchNotices={globalSwitchNotices}
          pendingGlobalQuestionKey={pendingGlobalQuestionKey}
          markersByIndex={markersByIndex}
          isBusy={isBusy}
          markdownComponents={markdownComponents}
          onSearchAcrossDocs={handleSearchAcrossDocs}
          extractUserQuestion={extractUserQuestion}
          onNavigate={handleNavigation}
        />
        {error && (
          <FOOTNOTE theme="danger" className="mt-4">
            {error}
          </FOOTNOTE>
        )}
      </div>

      <AskPageAIChatInput
        question={question}
        onQuestionChange={setQuestion}
        onSubmit={handleSubmit}
        isBusy={isBusy}
        conversationLength={conversation.length}
      />
    </div>
  );
}
