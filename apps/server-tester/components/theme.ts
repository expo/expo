import { Platform } from 'react-native';

export const colors = {
  background: '#000000',
  surface: '#151718',
  surfaceRaised: '#202425',
  border: '#313538',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.7)',
};

export const monospaceFontFamily = Platform.select({
  ios: 'ui-monospace',
  android: 'monospace',
  default: `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
});
