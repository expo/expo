import { CodeGenerator, type ConfigPlugin } from 'expo/config-plugins';
import { PluginConfigType } from './pluginConfig';
type MergeResults = ReturnType<typeof CodeGenerator.mergeContents>;
export declare function addFmtConstevalFixToPodfile(src: string): MergeResults;
export declare function removeFmtConstevalFixFromPodfile(src: string): MergeResults;
/**
 * Patches `fmt`'s `base.h` after `pod install` when building React Native from source, so Apple Clang in
 * Xcode 26.4+ can compile `FMT_STRING` (see https://github.com/expo/expo/issues/44229).
 */
export declare const withIosFmtConstevalFix: ConfigPlugin<PluginConfigType>;
export {};
