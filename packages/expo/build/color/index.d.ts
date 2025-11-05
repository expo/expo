import { type ColorValue } from 'react-native';
import type { AndroidBaseColorAttr, AndroidBaseColorName } from './android.types';
import type { IOSColorName } from './ios.types';
export { AndroidBaseColorAttr, AndroidBaseColorName, IOSColorName };
type ColorGroup<PredefinedValues extends string> = {
    [key in PredefinedValues | (string & {})]: ColorValue;
};
export interface ColorType {
    ios: ColorGroup<IOSColorName>;
    android: ColorGroup<AndroidBaseColorName> & {
        attr: ColorGroup<AndroidBaseColorAttr>;
    };
}
export declare const Color: ColorType;
//# sourceMappingURL=index.d.ts.map