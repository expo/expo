import { EXPO_LOCAL, EXPO_STAGING, XDL_HOST, XDL_PORT, XDL_SCHEME } from '../../utils/env';

interface ApiConfig {
  scheme: string;
  host: string;
  port: number | null;
}

interface ProcessSettings {
  api: ApiConfig;
  developerTool: string;
  isOffline: boolean;
}

function getAPI(): ApiConfig {
  if (EXPO_LOCAL) {
    return {
      scheme: 'http',
      host: 'localhost',
      port: 3000,
    };
  } else if (EXPO_STAGING) {
    return {
      scheme: XDL_SCHEME,
      host: 'staging.exp.host',
      port: XDL_PORT || null,
    };
  } else {
    return {
      scheme: XDL_SCHEME,
      host: XDL_HOST,
      port: XDL_PORT || null,
    };
  }
}

const settings: ProcessSettings = {
  api: getAPI(),
  developerTool: 'expo-cli',
  isOffline: false,
};

export default settings;
