'use client';

import { View, Text, Button } from 'react-native';
import { useState, useTransition } from 'react';

export const UIHost = ({
  renderNativeViews,
}: {
  renderNativeViews: (param: string) => Promise<React.ReactElement>;
}) => {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(0);
  const [remoteJsx, setText] = useState<React.ReactElement | Promise<React.ReactElement>>(<></>);
  const handleClick1 = () => {
    startTransition(() => {
      setText(renderNativeViews('c=' + count));
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
        testID="update-jsx-server-action-props"
        onPress={() => setCount((c) => c + 1)}
        title="Increment++"
      />

      <Button
        testID="call-jsx-server-action"
        onPress={handleClick1}
        title={`Invoke: renderNativeViews("c=" + ${count})`}
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

        {remoteJsx}
      </View>
    </View>
  );
};
