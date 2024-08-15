'use client';

import { Button, ScrollView, Text, View } from 'react-native';

import { useActions, useAIState, useUIState } from 'ai/rsc';
import { useState } from 'react';

export function ActionButton(props) {
  const [input, setInput] = useState('');

  const [messages, setMessages] = useUIState<typeof import('./ai-actions').AI>();
  const [aiState] = useAIState();
  const { submitUserMessage } = useActions();

  return (
    <>
      <ScrollView>
        {messages.map((message, i) => (
          <View key={i}>{message.display}</View>
        ))}
      </ScrollView>
      <Button
        {...props}
        onPress={() => {
          const message = 'Tell me a story about Evan Bacon';
          setMessages((currentMessages) => [
            ...currentMessages,
            {
              id: Date.now(),
              display: <Text>{message}</Text>,
            },
          ]);

          submitUserMessage(message).then((responseMessage) => {
            console.log(responseMessage);
            setMessages((currentMessages) => [...currentMessages, responseMessage]);
          });
        }}
      />
    </>
  );
}
