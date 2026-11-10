import { StyleSheet } from 'react-native';

import { colors } from './theme';

export const box = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 20,
    width: '100%',
    maxWidth: 480,
    marginHorizontal: 'auto',
  },
});
