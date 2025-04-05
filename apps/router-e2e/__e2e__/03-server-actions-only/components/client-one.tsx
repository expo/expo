'use client';

import { startTransition, useState, useTransition } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { getResults } from './functions';

export function ClientOne() {
  //   const [isPending, startTransition] = useTransition();
  const [remoteJsx, setText] = useState<Promise<string>[]>([]);

  return (
    <View style={styles.container}>
      <Button
        title="Call Server Function"
        onPress={() => {
          startTransition(() => {
            const res = getResults();
            setText((existing) => [...existing, res]);
          });
        }}
      />

      <View style={styles.container}>
        {/* {isPending && <Text>Transition pending...</Text>} */}

        <Text>Server Result → </Text>

        {remoteJsx.map((jsx, i) => (
          <Text key={i}>{jsx}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    borderColor: 'darkcyan',
    borderStyle: 'dashed',
    padding: 8,
    gap: 8,
  },
});
