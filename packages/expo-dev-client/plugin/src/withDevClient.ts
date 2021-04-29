import { ExpoConfig } from '@expo/config-types';
// @ts-expect-error missing types
import withDevLauncher from 'expo-dev-launcher/app.plugin';
// @ts-expect-error missing types
import withDevMenu from 'expo-dev-menu/app.plugin';

export default function withDevClient(config: ExpoConfig) {
  config = withDevMenu(config);
  config = withDevLauncher(config);
  return config;
}
