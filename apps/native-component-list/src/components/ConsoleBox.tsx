import { Code } from '@expo/html-elements';
import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export default function ConsoleBox({ children, style }: Props) {
  return (
    <ScrollView style={[styles.scrollView, style]} indicatorStyle="black">
      <ScrollView contentContainerStyle={styles.contentContainer} horizontal indicatorStyle="black">
        <Code style={styles.monoText}>{children}</Code>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#666',
  },
  contentContainer: {
    padding: 6,
  },
  monoText: {
    fontSize: 10,
  },
});
