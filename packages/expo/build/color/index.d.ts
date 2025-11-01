import { type ColorValue } from 'react-native';
import { type AndroidMaterialColorName } from './materialColor';
export { AndroidMaterialColorName } from './materialColor';
export type IOSColorName = 'systemBlue' | 'systemRed' | 'systemGreen' | 'systemYellow' | 'systemGray' | 'label' | 'secondaryLabel' | 'tertiaryLabel' | 'quaternaryLabel' | 'systemFill' | 'secondarySystemFill' | 'tertiarySystemFill' | 'quaternarySystemFill' | 'systemBackground' | 'secondarySystemBackground' | 'tertiarySystemBackground' | 'systemGroupedBackground' | 'secondarySystemGroupedBackground' | 'tertiarySystemGroupedBackground' | 'separator' | 'opaqueSeparator' | 'link';
export type AndroidBaseColorName = 'background_dark' | 'background_light';
export type AndroidAttrColorName = // TODO: https://developer.android.com/reference/android/R.attr
'colorPrimary' | 'colorError' | 'colorAccent' | 'colorBackground' | 'colorForeground';
type ColorGroup<PredefinedValues extends string> = {
    [key in PredefinedValues | (string & {})]: ColorValue;
};
export interface ColorType {
    ios: ColorGroup<IOSColorName>;
    android: ColorGroup<AndroidBaseColorName> & {
        attr: ColorGroup<AndroidAttrColorName>;
        material: {
            dynamic: {
                [key in AndroidMaterialColorName]: ColorValue | undefined;
            };
        } & {
            [key in AndroidMaterialColorName]: ColorValue | undefined;
        };
    };
}
export declare const Color: ColorType;
//# sourceMappingURL=index.d.ts.map