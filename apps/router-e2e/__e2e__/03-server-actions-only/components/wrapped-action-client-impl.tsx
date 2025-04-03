'use client';

import { useState, useTransition } from 'react';
import { Button, Text, View } from 'react-native';

import { useActions } from './wrapped-provider';

export function CallActions() {
  const actions = useActions();

  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'darkcyan',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <UseCallActions action={actions.one} title="one" />
      <UseCallActions action={actions.two} title="two" />
    </View>
  );
}

export function UseCallActions({
  title,
  action,
}: {
  title: string;
  action: () => React.ReactElement;
}) {
  const [isPending, startTransition] = useTransition();
  const [remoteJsx, setText] = useState<React.ReactElement[]>([]);
  const handleClick1 = () => {
    startTransition(() => {
      const res = action();
      setText((existing) => [...existing, res]);
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
      <Text>({title})</Text>
      <Button
        testID={'call-jsx-server-action-' + title}
        onPress={handleClick1}
        title={`Invoke: action()`}
      />

      <View
        style={{
          borderWidth: 3,
          borderColor: 'darkcyan',
          borderStyle: 'dashed',
          padding: 8,
          gap: 8,
        }}>
        <Text>{`${isPending ? 'Transition Pending...' : ''}`}</Text>

        <Text>Server Result → </Text>

        {remoteJsx.map((jsx, i) => (
          <Text key={i} testID={'action-results-' + title + '-' + i}>
            {jsx}
          </Text>
        ))}
      </View>
    </View>
  );
}
