import { ConfigPlugin } from '../Plugin.types';
import { ExportedConfigWithProps } from '..';
import { ExpoConfig } from '@expo/config-types';
type AndroidScreenSizesConfig = {
    smallScreens?: boolean;
    normalScreens?: boolean;
    largeScreens?: boolean;
    xlargeScreens?: boolean;
    anyDensity?: boolean;
    requiresSmallestWidthDp?: number;
    compatibleWidthLimitDp?: number;
    largestWidthLimitDp?: number;
};
export declare function getSupportsScreen(config: Pick<ExpoConfig, 'android'>): AndroidScreenSizesConfig;
export declare const setSupportsScreens: (config: ExportedConfigWithProps, supportsScreensConfig: AndroidScreenSizesConfig) => ExportedConfigWithProps<any>;
export declare const withDeviceFamily: ConfigPlugin<AndroidScreenSizesConfig | void>;
export default withDeviceFamily;
