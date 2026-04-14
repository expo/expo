import { ConfigPlugin } from 'expo/config-plugins';
import { IBSplashScreenDocument } from './InterfaceBuilder';
import { IOSSplashConfig } from './types';
export declare const withIosSplashScreenImage: ConfigPlugin<IOSSplashConfig>;
export declare function applySplashScreenStoryboard(obj: IBSplashScreenDocument, splash: IOSSplashConfig): IBSplashScreenDocument;
