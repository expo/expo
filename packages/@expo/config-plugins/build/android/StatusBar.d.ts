import { ExpoConfig } from '@expo/config-types';
import { ResourceXML } from './Resources';
import { ConfigPlugin } from '../Plugin.types';
export declare const withStatusBar: ConfigPlugin;
export declare function setStatusBarColors(config: Pick<ExpoConfig, 'androidStatusBar'>, colors: ResourceXML): ResourceXML;
export declare function setStatusBarStyles(config: Pick<ExpoConfig, 'androidStatusBar'>, styles: ResourceXML): ResourceXML;
export declare function getStatusBarColor(config: Pick<ExpoConfig, 'androidStatusBar'>): string | undefined;
/**
 * Specifies whether the status bar should be "translucent". When true, the status bar is drawn with `position: absolute` and a gray underlay, when false `position: relative` (pushes content down).
 *
 * @default false
 * @param config
 * @returns
 */
export declare function getStatusBarTranslucent(config: Pick<ExpoConfig, 'androidStatusBar'>): boolean;
export declare function getStatusBarStyle(config: Pick<ExpoConfig, 'androidStatusBar'>): "light-content" | "dark-content";
