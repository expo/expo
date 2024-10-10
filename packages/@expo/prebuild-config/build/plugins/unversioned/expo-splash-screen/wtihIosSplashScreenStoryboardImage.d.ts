import { ConfigPlugin } from '@expo/config-plugins';
import { IBSplashScreenDocument } from './InterfaceBuilder';
import { IOSPluginConfig } from './getIosSplashConfig';
export declare const withIosSplashScreenImage: ConfigPlugin<IOSPluginConfig>;
export declare function applySplashScreenStoryboard(obj: IBSplashScreenDocument, splash: IOSPluginConfig): IBSplashScreenDocument;
