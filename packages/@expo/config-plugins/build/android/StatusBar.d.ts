import { ExpoConfig } from '@expo/config-types';
import { ResourceXML } from './Resources';
import { ConfigPlugin } from '../Plugin.types';
export declare const withStatusBar: ConfigPlugin;
export declare function setStatusBarStyles(config: Pick<ExpoConfig, 'androidStatusBar'>, styles: ResourceXML): ResourceXML;
export declare function getStatusBarStyle(config: Pick<ExpoConfig, 'androidStatusBar'>): "light-content" | "dark-content";
