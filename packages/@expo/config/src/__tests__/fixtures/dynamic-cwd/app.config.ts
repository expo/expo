import type { ConfigContext, ExpoConfig } from '@expo/config';

export default ({ config }: ConfigContext): Partial<ExpoConfig> => {
  const expoConfig = {
    extra: {
      processCwd: process.cwd(),
    },
  };
  return expoConfig;
};
