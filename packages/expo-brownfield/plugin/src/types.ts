import type { AndroidPluginProps } from './android';
import type { IOSPluginProps } from './ios';

export interface PluginPropsType {
  android?: AndroidPluginProps;
  ios?: IOSPluginProps;
  /**
   * Embed a JavaScript bundle in the debug artifacts so a host app can run without a Metro dev
   * server. Set here it applies to both platforms; `android.bundleInDebug` / `ios.bundleInDebug`
   * override it per platform.
   *
   * @default false
   */
  bundleInDebug?: boolean;
}

export type PluginProps = PluginPropsType | undefined;
