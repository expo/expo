import type { AndroidPluginProps } from './android';
import type { IOSPluginProps } from './ios';

export interface PluginPropsType {
  android?: AndroidPluginProps;
  ios?: IOSPluginProps;
}

export type PluginProps = PluginPropsType | undefined;
