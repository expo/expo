import { ConfigContext, ExpoConfig } from '@expo/config';
import 'tsx/cjs';

const config = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      observe: {
        endpointUrl:
          process.env.OBSERVE_ENV === 'staging'
            ? 'https://staging-o.expo.dev/'
            : 'https://o.expo.dev/',
      },
    },
  },
});

export default config;
