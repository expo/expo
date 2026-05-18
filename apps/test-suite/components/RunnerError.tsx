import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../common/ThemeProvider';

type RunnerErrorProps = {
  children: ReactNode;
};

export default function RunnerError({ children }: RunnerErrorProps) {
  const { top } = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: top || 18, backgroundColor: theme.background.screen },
      ]}>
      <Text style={[styles.text, { color: theme.text.danger }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
  },
});
