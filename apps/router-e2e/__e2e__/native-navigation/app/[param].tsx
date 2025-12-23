import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';

export default function Page() {
  const local = useLocalSearchParams() as Record<string, string | undefined>;
  const params = { ...local };
  const json = JSON.stringify(params, null, 2);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.json}>{json}</Text>
        <Link href="/a" prefetch>
          Go to /a
        </Link>
        <Link href="/b" prefetch>
          Go to /b
        </Link>
        <Link href="/x" prefetch>
          Go to /x
        </Link>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  json: {
    width: '100%',
    fontSize: 14,
    color: '#111',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
});
