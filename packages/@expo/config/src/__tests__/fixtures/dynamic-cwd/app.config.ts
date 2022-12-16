import { ConfigContext, ExpoConfig } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoConfig = {
    extra: {
      processCwd: process.cwd(),
    },
  };
  return expoConfig;
};
