
export default interface AppConfig {
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
      publishBundlePath: string;
    };
    android: {
      package: string;
      publishBundlePath: string;
    };

    kernel?: {
      iosManifestPath: string;
      androidManifestPath: string;
    };
    isKernel?: boolean;
  }
}
