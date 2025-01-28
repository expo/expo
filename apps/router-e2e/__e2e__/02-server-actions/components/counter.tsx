/// <reference types="react/canary" />
'use client';

import { View, Text, Button } from 'react-native';
import React, { useState, useTransition } from 'react';

import { greetWithHeaders } from './server-actions-in-file';

export const Counter = ({ greet }: { greet: (name: string) => Promise<string> }) => {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(0);
  const [text, setText] = useState<string | Promise<string>>('');
  const handleClick1 = () => {
    startTransition(() => {
      setText(greet('c=' + count));
    });
  };
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'darkcyan',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text>(client component)</Text>
      <Button
        onPress={() => setCount((c) => c + 1)}
        testID="button-client-state"
        title="Increment++"
      />
      <Text testID="client-state-count">{count}</Text>

      <Text onPress={handleClick1} testID="button-server-action">
        Call Server Action: {count}
      </Text>

      <React.Suspense fallback={<Text>Loading...</Text>}>{greetWithHeaders()}</React.Suspense>

      <View
        style={{
          borderWidth: 3,
          borderColor: 'darkcyan',
          borderStyle: 'dashed',
          padding: 8,
          gap: 8,
        }}>
        <Text testID="client-transition-pending">{`${isPending ? 'Transition Pending...' : ''}`}</Text>

        <Text>Server Result → </Text>
        <Text testID="client-transition-text">{text || '[No results]'}</Text>
      </View>
    </View>
  );
};
