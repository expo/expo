import { ConfigPlugin, IOSConfig } from '@expo/config-plugins';
import { InfoPlist } from '@expo/config-plugins/build/ios/IosConfig.types';
import { ExpoConfig } from '@expo/config-types';
declare type ExpoConfigFacebook = Pick<ExpoConfig, 'facebookScheme' | 'facebookAdvertiserIDCollectionEnabled' | 'facebookAppId' | 'facebookAutoInitEnabled' | 'facebookAutoLogAppEventsEnabled' | 'facebookDisplayName'>;
export declare const withFacebookIOS: ConfigPlugin<void>;
/**
 * Getters
 * TODO: these getters are the same between ios/android, we could reuse them
 */
export declare function getFacebookScheme(config: ExpoConfigFacebook): string | null;
export declare function getFacebookAppId(config: Pick<ExpoConfigFacebook, 'facebookAppId'>): string | null;
export declare function getFacebookDisplayName(config: ExpoConfigFacebook): string | null;
export declare function getFacebookAutoInitEnabled(config: ExpoConfigFacebook): boolean | null;
export declare function getFacebookAutoLogAppEvents(config: ExpoConfigFacebook): boolean | null;
export declare function getFacebookAdvertiserIDCollection(config: ExpoConfigFacebook): boolean | null;
/**
 * Setters
 */
export declare function setFacebookConfig(config: ExpoConfigFacebook, infoPlist: InfoPlist): IOSConfig.InfoPlist;
export declare function setFacebookScheme(config: ExpoConfigFacebook, infoPlist: InfoPlist): IOSConfig.InfoPlist;
export declare function setFacebookAutoInitEnabled(config: ExpoConfigFacebook, { FacebookAutoInitEnabled, ...infoPlist }: InfoPlist): {
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookAppID?: string | undefined;
    FacebookDisplayName?: string | undefined;
    FacebookAutoLogAppEventsEnabled?: boolean | undefined;
    FacebookAdvertiserIDCollectionEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
} | {
    FacebookAutoInitEnabled: boolean;
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookAppID?: string | undefined;
    FacebookDisplayName?: string | undefined;
    FacebookAutoLogAppEventsEnabled?: boolean | undefined;
    FacebookAdvertiserIDCollectionEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
};
export declare function setFacebookAutoLogAppEventsEnabled(config: ExpoConfigFacebook, { FacebookAutoLogAppEventsEnabled, ...infoPlist }: InfoPlist): {
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookAppID?: string | undefined;
    FacebookDisplayName?: string | undefined;
    FacebookAutoInitEnabled?: boolean | undefined;
    FacebookAdvertiserIDCollectionEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
} | {
    FacebookAutoLogAppEventsEnabled: boolean;
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookAppID?: string | undefined;
    FacebookDisplayName?: string | undefined;
    FacebookAutoInitEnabled?: boolean | undefined;
    FacebookAdvertiserIDCollectionEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
};
export declare function setFacebookAdvertiserIDCollectionEnabled(config: ExpoConfigFacebook, { FacebookAdvertiserIDCollectionEnabled, ...infoPlist }: InfoPlist): {
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookAppID?: string | undefined;
    FacebookDisplayName?: string | undefined;
    FacebookAutoInitEnabled?: boolean | undefined;
    FacebookAutoLogAppEventsEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
} | {
    FacebookAdvertiserIDCollectionEnabled: boolean;
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookAppID?: string | undefined;
    FacebookDisplayName?: string | undefined;
    FacebookAutoInitEnabled?: boolean | undefined;
    FacebookAutoLogAppEventsEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
};
export declare function setFacebookAppId(config: Pick<ExpoConfigFacebook, 'facebookAppId'>, { FacebookAppID, ...infoPlist }: InfoPlist): {
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookDisplayName?: string | undefined;
    FacebookAutoInitEnabled?: boolean | undefined;
    FacebookAutoLogAppEventsEnabled?: boolean | undefined;
    FacebookAdvertiserIDCollectionEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
} | {
    FacebookAppID: string;
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookDisplayName?: string | undefined;
    FacebookAutoInitEnabled?: boolean | undefined;
    FacebookAutoLogAppEventsEnabled?: boolean | undefined;
    FacebookAdvertiserIDCollectionEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
};
export declare function setFacebookDisplayName(config: ExpoConfigFacebook, { FacebookDisplayName, ...infoPlist }: InfoPlist): {
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookAppID?: string | undefined;
    FacebookAutoInitEnabled?: boolean | undefined;
    FacebookAutoLogAppEventsEnabled?: boolean | undefined;
    FacebookAdvertiserIDCollectionEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
} | {
    FacebookDisplayName: string;
    UIStatusBarHidden?: boolean | undefined;
    UIStatusBarStyle?: string | undefined;
    UILaunchStoryboardName?: string | undefined;
    CFBundleShortVersionString?: string | undefined;
    CFBundleVersion?: string | undefined;
    CFBundleDisplayName?: string | undefined;
    CFBundleIdentifier?: string | undefined;
    CFBundleName?: string | undefined;
    CFBundleURLTypes?: import("@expo/config-plugins/build/ios/IosConfig.types").URLScheme[] | undefined;
    CFBundleDevelopmentRegion?: string | undefined;
    ITSAppUsesNonExemptEncryption?: boolean | undefined;
    LSApplicationQueriesSchemes?: string[] | undefined;
    FacebookAppID?: string | undefined;
    FacebookAutoInitEnabled?: boolean | undefined;
    FacebookAutoLogAppEventsEnabled?: boolean | undefined;
    FacebookAdvertiserIDCollectionEnabled?: boolean | undefined;
    UIBackgroundModes?: string[] | undefined;
    UISupportedInterfaceOrientations?: import("@expo/config-plugins/build/ios/IosConfig.types").InterfaceOrientation[] | undefined;
    GMSApiKey?: string | undefined;
    GADApplicationIdentifier?: string | undefined;
    UIUserInterfaceStyle?: "Light" | "Dark" | "Automatic" | undefined;
    UIRequiresFullScreen?: boolean | undefined;
    SKAdNetworkItems?: {
        SKAdNetworkIdentifier: string;
    }[] | undefined;
    branch_key?: {
        live?: string | undefined;
    } | undefined;
};
export declare function setFacebookApplicationQuerySchemes(config: Pick<ExpoConfigFacebook, 'facebookAppId'>, infoPlist: InfoPlist): InfoPlist;
export declare const withUserTrackingPermission: ConfigPlugin<{
    userTrackingPermission?: string;
} | void>;
export {};
