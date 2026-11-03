import { Stack } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface PageProps {
  title: string;
  testID: string;
  children?: ReactNode;
}

export function Page({ title, testID, children }: PageProps) {
  return (
    <View testID={testID} style={styles.page}>
      <Stack.Screen options={{ title }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
});
