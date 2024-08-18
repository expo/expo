import { CoreMessage } from 'ai';
import { createAI, getMutableAIState, streamUI, createStreamableValue } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';

import React from 'react';
import { z } from 'zod';

import { Text } from './react-native';
import { BotMessage } from './stream-text';

const nanoid = () => Math.random().toString(36).slice(2);

async function submitUserMessage(content: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content,
      },
    ],
  });

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode;

  // The `render()` creates a generated, streamable UI.
  const result = await streamUI({
    model: openai('gpt-3.5-turbo'),
    // Lock temperature to 0 to reduce randomness in the responses, this is better for demo purposes.
    temperature: 0,
    // model: 'gpt-4-0125-preview',
    messages: [
      {
        role: 'system',
        content: `\
  You are a planning assistant. You can answer questions about the weather, find points of interest, order an Uber, send messages, and get movie information.
  If the user asks to do things relative to the time, the date and time is ${new Date()}.
  
  ${
    process.env.EXPO_OS === 'web'
      ? 'You cannot schedule events on this platform. If the user asks, inform that they should try again from the Expo AI native app.'
      : ''
  }
  
  Besides the default functionality, you can chat with the user about anything.
        `,
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name,
      })),
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('');
        textNode = <BotMessage content={textStream.value} />;
      }

      if (done) {
        textStream.done();
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content,
            },
          ],
        });
      } else {
        textStream.update(delta);
      }

      return textNode;
    },
    tools: {
      get_weather: {
        description: 'Get the current weather for a city',
        parameters: z
          .object({
            city: z.string().describe('the city to get the weather for'),
          })
          .required(),
        generate: async function* ({ city }) {
          yield <Text>Loading...</Text>;

          await sleep(1000);

          return <Text>{city}</Text>;
        },
      },
    },
  });

  return {
    id: Date.now(),
    display: result.value,
  };
}

export type Message = CoreMessage & {
  id: string;
};

export type AIState = {
  chatId: string;
  messages: Message[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  // Each state can be any shape of object, but for chat applications
  // it makes sense to have an array of messages. Or you may prefer something like { id: number, messages: Message[] }
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
});

async function sleep(ms: number) {
  // This is used to emulate server delay, we don't need it in production.
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  console.log('SERVER: Fake sleeping for:', ms);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
