/**
 * @flow
 */
export type NativeAnalyticsParameters = {|
  campaign?: string,
  content?: string,
  medium?: string,
  source?: string,
  term?: string,
|};

export type NativeAndroidParameters = {|
  fallbackUrl?: string,
  minimumVersion?: number,
  packageName?: string,
|};

export type NativeIOSParameters = {|
  appStoreId?: string,
  bundleId?: string,
  customScheme?: string,
  fallbackUrl?: string,
  iPadBundleId?: string,
  iPadFallbackUrl?: string,
  minimumVersion?: string,
|};

export type NativeITunesParameters = {|
  affiliateToken?: string,
  campaignToken?: string,
  providerToken?: string,
|};

export type NativeNavigationParameters = {|
  forcedRedirectEnabled?: boolean,
|};

export type NativeSocialParameters = {|
  descriptionText?: string,
  imageUrl?: string,
  title?: string,
|};

export type NativeDynamicLink = {|
  analytics: NativeAnalyticsParameters,
  android: NativeAndroidParameters,
  dynamicLinkDomain: string,
  ios: NativeIOSParameters,
  itunes: NativeITunesParameters,
  link: string,
  navigation: NativeNavigationParameters,
  social: NativeSocialParameters,
|};
