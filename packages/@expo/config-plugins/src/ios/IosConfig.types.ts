import { JSONValue } from '@expo/json-file';

export type URLScheme = {
  CFBundleURLName?: string;
  CFBundleURLSchemes: string[];
};

export type InterfaceOrientation =
  | 'UIInterfaceOrientationPortrait'
  | 'UIInterfaceOrientationPortraitUpsideDown'
  | 'UIInterfaceOrientationLandscapeLeft'
  | 'UIInterfaceOrientationLandscapeRight';

export type InterfaceStyle = 'Light' | 'Dark' | 'Automatic';

export type InfoPlist = Record<string, JSONValue | undefined> & {
  UIStatusBarHidden?: boolean;
  UIStatusBarStyle?: string;
  UILaunchStoryboardName?: string | 'SplashScreen';
  CFBundleShortVersionString?: string;
  CFBundleVersion?: string;
  CFBundleDisplayName?: string;
  CFBundleIdentifier?: string;
  CFBundleName?: string;
  CFBundleURLTypes?: URLScheme[];
  CFBundleDevelopmentRegion?: string;
  ITSAppUsesNonExemptEncryption?: boolean;
  LSApplicationQueriesSchemes?: string[];
  FacebookAppID?: string;
  FacebookDisplayName?: string;
  FacebookAutoInitEnabled?: boolean;
  FacebookAutoLogAppEventsEnabled?: boolean;
  FacebookAdvertiserIDCollectionEnabled?: boolean;
  UIBackgroundModes?: string[];
  UISupportedInterfaceOrientations?: InterfaceOrientation[];
  GMSApiKey?: string;
  GADApplicationIdentifier?: string;
  UIUserInterfaceStyle?: InterfaceStyle;
  UIRequiresFullScreen?: boolean;
  SKAdNetworkItems?: { SKAdNetworkIdentifier: string }[];
  branch_key?: { live?: string };
};

export type ExpoPlist = {
  EXUpdatesCheckOnLaunch?: string;
  EXUpdatesEnabled?: boolean;
  EXUpdatesLaunchWaitMs?: number;
  EXUpdatesReleaseChannel?: string;
  EXUpdatesRuntimeVersion?: string;
  EXUpdatesRequestHeaders: Record<string, string>;
  EXUpdatesSDKVersion?: string;
  EXUpdatesURL?: string;
  EXUpdatesCodeSigningCertificate?: string;
  EXUpdatesCodeSigningMetadata?: Record<string, string>;
};
