export type AndroidCompatibility = {
  minimumVersion: number;
  compileSdkVersion: number;
  targetSdkVersion?: number;
  buildToolsVersion?: string;
};

export type IosCompatibility = {
  minimumVersion: string;
  xcodeVersionRange: string;
};

export type RuntimeCompatibility = {
  reactNative: string;
  reactNativeWeb: string;
  reactNativeTvos?: string;
  react?: string;
};

export type SdkCompatibility = {
  sdk: string;
  android: AndroidCompatibility;
  ios: IosCompatibility;
  runtime: RuntimeCompatibility;
  nodeVersionRange?: string;
};

export type SdkCompatibilityData = {
  schemaVersion: 1;
  sdkVersions: SdkCompatibility[];
};
