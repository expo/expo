import { env } from '../../env';

export const TELEMETRY_ENDPOINT = 'https://cdp.expo.dev/v1/batch';

export const TELEMETRY_TARGET =
  env.EXPO_STAGING || env.EXPO_LOCAL
    ? '24TKICqYKilXM480mA7ktgVDdea'
    : '24TKR7CQAaGgIrLTgu3Fp4OdOkI'; // expo unified
