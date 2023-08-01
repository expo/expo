import { Platform } from 'react-native';

export const CODE_FONT = Platform.select({
  default: 'Courier',
  ios: 'Courier New',
  android: 'monospace',
});
