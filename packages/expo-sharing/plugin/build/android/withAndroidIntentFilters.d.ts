import { ConfigPlugin, AndroidManifest, AndroidConfig, ExportedConfigWithProps } from '@expo/config-plugins';
import { SingleIntentFilter, MultiIntentFilter, IntentFilter } from '../sharingPlugin.types';
type WithAndroidIntentFiltersOptions = {
    intentFilters: IntentFilter[];
};
export declare const withAndroidIntentFilters: ConfigPlugin<WithAndroidIntentFiltersOptions>;
export declare function setAndroidIntentFilters(config: ExportedConfigWithProps<AndroidManifest>, intentFilters: IntentFilter[]): ExportedConfigWithProps<AndroidManifest>;
export default function renderIntentFilters(intentFilters: (SingleIntentFilter | MultiIntentFilter)[]): AndroidConfig.Manifest.ManifestIntentFilter[];
export {};
