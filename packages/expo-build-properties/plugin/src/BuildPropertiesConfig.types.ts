export interface BuildPropertiesPluginConfig {
  android?: {
    compileSdkVersion?: string;
    targetSdkVersion?: string;
    buildToolsVersion?: string;
    kotlinVersion?: string;
  };
  ios?: {};
}
