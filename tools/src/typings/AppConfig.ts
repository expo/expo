import { JSONObject } from '@expo/json-file';

export default interface AppConfig extends JSONObject {
  expo: {
    name: string;
    description: string;
    slug: string;
    privacy: string;
    sdkVersion: string;
    version: string;
    orientation: string;
    platforms: string[];
    primaryColor: string;
    icon: string;

    ios: {
      bundleIdentifier: string;
      supportsTablet: boolean;
      publishBundlePath?: string;
    };
    android: {
      package: string;
      publishBundlePath?: string;
    };

    kernel?: {
      iosManifestPath: string;
      androidManifestPath: string;
    };
    isKernel?: boolean;

    extra?: {
      eas?: {
        projectId?: string;
      };
    };

    updates?: {
      url?: string;
    };
  };
}
