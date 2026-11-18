import { ConfigContext, ExpoConfig } from '@expo/config';
import 'tsx/cjs';

// Consent test builds: `OBSERVE_CONSENT` sets `extra.eas.observe.consent` (omitted when unset),
// `OBSERVE_UPDATES_ENABLED=false` turns off expo-updates, which also creates the installation ID,
// and `OBSERVE_APP_VERSION` overrides the app version to simulate an upgrade.
const { OBSERVE_CONSENT, OBSERVE_UPDATES_ENABLED, OBSERVE_APP_VERSION } = process.env;

const config = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Observe',
  slug: 'observability',
  version: OBSERVE_APP_VERSION ?? config.version,
  updates:
    OBSERVE_UPDATES_ENABLED === 'false' ? { ...config.updates, enabled: false } : config.updates,
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      observe: {
        endpointUrl:
          process.env.OBSERVE_ENV === 'staging'
            ? 'https://staging-o.expo.dev/'
            : 'https://o.expo.dev/',
        ...(OBSERVE_CONSENT && { consent: OBSERVE_CONSENT }),
      },
    },
  },
});

export default config;
