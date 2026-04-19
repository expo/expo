import { ConfigContext, ExpoConfig } from '@expo/config';
import 'tsx/cjs';

const config = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Observe',
  slug: 'observability',
  extra: {
    ...config.extra,
    eas: {
      projectId: '5310c5f2-8ab4-4d5e-8f53-a5c90aa9594a',
      observe: {
        enableInDebug: true,
        endpointUrl:
          process.env.OBSERVE_ENV === 'staging'
            ? 'https://staging-o.expo.dev/'
            : 'https://o.expo.dev/',
      },
    },
  },
});

export default config;
