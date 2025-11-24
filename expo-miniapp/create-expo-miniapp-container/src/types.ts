export interface CreateOptions {
  projectName: string;
  template: string;
  skipPrompts: boolean;
}

export interface PackageJsonDependencies {
  [key: string]: string;
}

export interface PackageJson {
  name: string;
  version: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: PackageJsonDependencies;
  devDependencies?: PackageJsonDependencies;
  private?: boolean;
}

export interface ExpoConfig {
  expo: {
    name: string;
    slug: string;
    version: string;
    orientation: string;
    icon: string;
    userInterfaceStyle: string;
    splash: {
      image: string;
      resizeMode: string;
      backgroundColor: string;
    };
    assetBundlePatterns: string[];
    ios?: {
      supportsTablet: boolean;
      bundleIdentifier: string;
    };
    android?: {
      adaptiveIcon: {
        foregroundImage: string;
        backgroundColor: string;
      };
      package: string;
    };
    web?: {
      favicon: string;
    };
    plugins?: Array<string | [string, any]>;
  };
}
