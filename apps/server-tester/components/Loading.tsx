import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

export function Loading() {
  return (
    <View style={styles.container}>
      <Text testID="suspense-fallback" style={styles.text}>
        Loading...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
});
