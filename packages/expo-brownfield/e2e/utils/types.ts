import type { PluginProps as PluginPropsAndroid } from '../../plugin/src/android/types';
import type { PluginProps as PluginPropsIOS } from '../../plugin/src/ios/types';

export interface PluginProps {
  android?: PluginPropsAndroid;
  ios?: PluginPropsIOS;
}

export interface TemplateEntry {
  filename: string;
  subdirectory?: string;
  content: string;
}
