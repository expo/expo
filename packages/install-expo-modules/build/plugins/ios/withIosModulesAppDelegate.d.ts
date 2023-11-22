import { ConfigPlugin } from '@expo/config-plugins';
export declare const withIosModulesAppDelegate: ConfigPlugin;
export declare const withIosModulesAppDelegateObjcHeader: ConfigPlugin;
export declare const withIosModulesSwiftBridgingHeader: ConfigPlugin;
export declare function updateModulesAppDelegateObjcImpl(contents: string, sdkVersion: string | undefined): string;
export declare function updateModulesAppDelegateObjcHeader(contents: string, sdkVersion: string | undefined): string;
export declare function updateModulesAppDelegateSwift(contents: string, sdkVersion: string | undefined): string;
