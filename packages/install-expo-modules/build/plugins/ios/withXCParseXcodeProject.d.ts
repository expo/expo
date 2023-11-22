import { ConfigPlugin, Mod } from '@expo/config-plugins';
import type { BuildSettings, XcodeProject } from 'xcparse';
export declare type XCParseXcodeProject = Partial<XcodeProject>;
export interface BuildSettingsExtended extends BuildSettings {
    SWIFT_OBJC_BRIDGING_HEADER?: string;
}
export declare const withXCParseXcodeProjectBaseMod: ConfigPlugin;
export declare const withXCParseXcodeProject: ConfigPlugin<Mod<XCParseXcodeProject>>;
export declare function getDesignatedSwiftBridgingHeaderFileReference(pbxproj: XCParseXcodeProject): string | null;
