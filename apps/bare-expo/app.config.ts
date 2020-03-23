import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'BareExpo',
  slug: 'bare-expo',
  privacy: 'unlisted',
  version: '1.0.0',
  platforms: ['ios', 'android', 'web'],
  web: {
    build: {
      babel: {
        root: './',
        include: ['test-suite', 'native-component-list', 'bare-expo'],
      },
    },
  },
  android: {
    package: 'dev.expo.payments',
  },
  ios: {
    bundleIdentifier: 'dev.expo.Payments',
  },
  notification: {
    // TODO: Add `serviceWorkerPath` to type
    // @ts-ignore
    serviceWorkerPath: '/expo-service-worker.js',
    vapidPublicKey:
      'BNHvR05XkY5LH9GdN0GreLx2wZnK9IwNJGVmo3jujIkFni4of26E3U3fnt9nUrZfM7h0omdIHKM0eshkzTSFOWQ',
  },
  ...config,
});
