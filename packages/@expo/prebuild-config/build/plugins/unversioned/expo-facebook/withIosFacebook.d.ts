import { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
declare type ExpoConfigFacebook = Pick<ExpoConfig, 'facebookScheme' | 'facebookAdvertiserIDCollectionEnabled' | 'facebookAppId' | 'facebookAutoInitEnabled' | 'facebookAutoLogAppEventsEnabled' | 'facebookDisplayName'>;
export declare const withIosFacebook: ConfigPlugin;
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
export declare function setFacebookConfig(config: ExpoConfigFacebook, infoPlist: InfoPlist): InfoPlist;
export declare function setFacebookScheme(config: ExpoConfigFacebook, infoPlist: InfoPlist): InfoPlist;
export declare function setFacebookAutoInitEnabled(config: ExpoConfigFacebook, { FacebookAutoInitEnabled, ...infoPlist }: InfoPlist): InfoPlist;
export declare function setFacebookAutoLogAppEventsEnabled(config: ExpoConfigFacebook, { FacebookAutoLogAppEventsEnabled, ...infoPlist }: InfoPlist): InfoPlist;
export declare function setFacebookAdvertiserIDCollectionEnabled(config: ExpoConfigFacebook, { FacebookAdvertiserIDCollectionEnabled, ...infoPlist }: InfoPlist): InfoPlist;
export declare function setFacebookAppId(config: Pick<ExpoConfigFacebook, 'facebookAppId'>, { FacebookAppID, ...infoPlist }: InfoPlist): InfoPlist;
export declare function setFacebookDisplayName(config: ExpoConfigFacebook, { FacebookDisplayName, ...infoPlist }: InfoPlist): InfoPlist;
export declare function setFacebookApplicationQuerySchemes(config: Pick<ExpoConfigFacebook, 'facebookAppId'>, infoPlist: InfoPlist): InfoPlist;
export {};
