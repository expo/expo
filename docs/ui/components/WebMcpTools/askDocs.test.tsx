import { jest } from '@jest/globals';
import type { PropsWithChildren } from 'react';

type ChatState = {
  error: string | null;
  isGeneratingAnswer: boolean;
  latest?: {
    status: 'streaming' | 'completed';
    answer: string;
    sources: { title: string; source_url: string }[];
  };
};

const submitQuery = jest.fn<(question: string) => void>();
let chatState: ChatState;

jest.unstable_mockModule('@kapaai/react-sdk', () => ({
  KapaProvider: ({ children }: PropsWithChildren) => children,
  useChat: () => ({
    submitQuery,
    error: chatState.error,
    isGeneratingAnswer: chatState.isGeneratingAnswer,
    conversation: { getLatest: () => chatState.latest },
  }),
}));

const { askKapaAsync } = await import('./askDocs');

beforeEach(() => {
  submitQuery.mockClear();
});

describe(askKapaAsync, () => {
  it('submits the question and resolves with the finished answer and its sources', async () => {
    chatState = {
      error: null,
      isGeneratingAnswer: false,
      latest: {
        status: 'completed',
        answer: 'Use expo-camera.',
        sources: [
          { title: 'Camera', source_url: 'https://docs.expo.dev/versions/latest/sdk/camera/' },
        ],
      },
    };

    const answer = await askKapaAsync('How do I add a camera?', new AbortController().signal);

    expect(submitQuery).toHaveBeenCalledWith('How do I add a camera?');
    expect(answer).toEqual({
      answer: 'Use expo-camera.',
      sources: [{ title: 'Camera', url: 'https://docs.expo.dev/versions/latest/sdk/camera/' }],
    });
    await Promise.resolve();
    expect(document.body).toBeEmptyDOMElement();
  });

  it('rejects when Kapa reports an error', async () => {
    chatState = { error: 'captcha failed', isGeneratingAnswer: false };

    await expect(askKapaAsync('Hi', new AbortController().signal)).rejects.toThrow(
      'Kapa could not answer: captcha failed'
    );
  });

  it('rejects when the agent aborts while the answer is still streaming', async () => {
    chatState = {
      error: null,
      isGeneratingAnswer: true,
      latest: { status: 'streaming', answer: 'Use', sources: [] },
    };
    const controller = new AbortController();

    const pending = askKapaAsync('Hi', controller.signal);
    controller.abort(new Error('stopped'));

    await expect(pending).rejects.toThrow('stopped');
  });
});
