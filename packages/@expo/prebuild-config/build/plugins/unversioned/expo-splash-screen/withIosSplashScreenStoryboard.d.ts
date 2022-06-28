import { ConfigPlugin, Mod } from '@expo/config-plugins';
import { IBSplashScreenDocument } from './InterfaceBuilder';
export declare const STORYBOARD_FILE_PATH = "./SplashScreen.storyboard";
/**
 * Provides the SplashScreen `.storyboard` xml data for modification.
 *
 * @param config
 * @param action
 */
export declare const withIosSplashScreenStoryboard: ConfigPlugin<Mod<IBSplashScreenDocument>>;
/** Append a custom rule to supply SplashScreen `.storyboard` xml data to mods on `mods.ios.splashScreenStoryboard` */
export declare const withIosSplashScreenStoryboardBaseMod: ConfigPlugin;
/** Get a template splash screen storyboard file. */
export declare function getTemplateAsync(): Promise<IBSplashScreenDocument>;
