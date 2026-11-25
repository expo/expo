export type AndroidCompatibility = {
  minimumVersion: number;
  compileSdkVersion: number;
  targetSdkVersion?: number;
  buildToolsVersion?: string;
};

export type IosCompatibility = {
  minimumVersion: string;
  xcodeVersionRange: string;
  xcodeVersionCheckRange?: string;
};

export type RuntimeCompatibility = {
  reactNative: string;
  reactNativeWeb: string;
  reactNativeTvos?: string;
  react?: string;
};

export type NodeCompatibility = {
  minimumVersion: string;
};

export type SdkCompatibility = {
  sdk: string;
  android: AndroidCompatibility;
  ios: IosCompatibility;
  runtime: RuntimeCompatibility;
  node?: NodeCompatibility;
};

export type SdkCompatibilityData = {
  schemaVersion: 1;
  sdkVersions: SdkCompatibility[];
};
