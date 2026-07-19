import type { ExpoConfig } from '@expo/config';

const withCustom = (config: ExpoConfig, props?: { name?: string }) => {
  config.name = props?.name ?? 'fallback-name';
  return config;
};

export default (): ExpoConfig => {
  const expoConfig = {
    plugins: ['./my-plugin', [withCustom, { name: 'custom-name' }]],
  };
  return expoConfig as any;
};
