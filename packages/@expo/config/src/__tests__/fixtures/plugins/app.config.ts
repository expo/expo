import { ExpoConfig } from '@expo/config';

const withCustom = (config, props) => {
  config.name = props?.name ?? 'fallback-name';
  return config;
};

export default (): ExpoConfig => {
  const expoConfig = {
    plugins: ['./my-plugin', [withCustom, { name: 'custom-name' }]],
  };
  return expoConfig as any;
};
