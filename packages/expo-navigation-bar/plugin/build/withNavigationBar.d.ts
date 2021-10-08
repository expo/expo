import { ConfigPlugin, AndroidConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare type Appearance = 'light' | 'dark';
export declare type Visibility = 'visible' | 'hidden';
export declare type Behavior = 'overlay-swipe' | 'inset-swipe' | 'inset-touch';
export declare type Position = 'relative' | 'absolute';
export declare type Props = {
    borderColor?: string;
    backgroundColor?: string;
    appearance?: Appearance;
    visibility?: Visibility;
    behavior?: Behavior;
    position?: Position;
    legacyVisible?: NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['visible']>;
};
export declare function resolveProps(config: ExpoConfig, _props: Props | void): Props;
export declare function setStrings(strings: AndroidConfig.Resources.ResourceXML, { backgroundColor, borderColor, appearance, visibility, position, behavior, legacyVisible }: Props): AndroidConfig.Resources.ResourceXML;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
