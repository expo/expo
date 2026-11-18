import { KapaProvider, useChat } from '@kapaai/react-sdk';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { KAPA_INTEGRATION_ID } from '~/ui/components/AskPageAI/kapaIntegrationId';

export type DocsAnswer = { answer: string; sources: { title: string; url: string }[] };

type QuestionProps = {
  question: string;
  onAnswer: (answer: DocsAnswer) => void;
  onError: (error: Error) => void;
};

function Question({ question, onAnswer, onError }: QuestionProps) {
  const { submitQuery, conversation, isGeneratingAnswer, error } = useChat();

  useEffect(() => {
    submitQuery(question);
  }, [question, submitQuery]);

  useEffect(() => {
    if (error) {
      onError(new Error(`Kapa could not answer: ${error}`));
      return;
    }
    const latest = conversation.getLatest();
    if (latest && latest.status !== 'streaming' && !isGeneratingAnswer) {
      onAnswer({
        answer: latest.answer,
        sources: latest.sources.map(source => ({ title: source.title, url: source.source_url })),
      });
    }
  }, [conversation, error, isGeneratingAnswer, onAnswer, onError]);

  return null;
}

export function askKapaAsync(question: string, signal: AbortSignal) {
  return new Promise<DocsAnswer>((resolve, reject) => {
    const container = document.createElement('div');
    container.hidden = true;
    document.body.append(container);
    const root = createRoot(container);

    let settled = false;
    const settle = (finish: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      signal.removeEventListener('abort', onAbort);
      finish();
      queueMicrotask(() => {
        root.unmount();
        container.remove();
      });
    };
    const onAbort = () => {
      settle(() => {
        reject(signal.reason);
      });
    };
    signal.addEventListener('abort', onAbort, { once: true });

    root.render(
      <KapaProvider integrationId={KAPA_INTEGRATION_ID} callbacks={{}}>
        <Question
          question={question}
          onAnswer={answer => {
            settle(() => {
              resolve(answer);
            });
          }}
          onError={error => {
            settle(() => {
              reject(error);
            });
          }}
        />
      </KapaProvider>
    );
  });
}
