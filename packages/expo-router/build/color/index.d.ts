import { type ColorValue } from 'react-native';
import type { AndroidColorAttrSDK1, AndroidColorAttrSDK5, AndroidColorAttrSDK14, AndroidColorAttrSDK21, AndroidColorAttrSDK23, AndroidColorAttrSDK25, AndroidColorAttrSDK26 } from './android.attr.types';
import type { AndroidBaseColorSDK1, AndroidBaseColorSDK14, AndroidBaseColorSDK31, AndroidBaseColorSDK34, AndroidBaseColorSDK35, AndroidDeprecatedColor } from './android.color.types';
import type { AndroidDynamicMaterialColorType } from './android.dynamic.types';
import type { AndroidStaticMaterialColorType } from './android.material.types';
import type { IOSBaseColor } from './ios.types';
export * from './android.color.types';
export * from './android.attr.types';
export * from './android.dynamic.types';
export * from './android.material.types';
export * from './ios.types';
export type AndroidBaseColor = AndroidBaseColorSDK1 & AndroidBaseColorSDK14 & AndroidBaseColorSDK31 & AndroidBaseColorSDK34 & AndroidBaseColorSDK35 & AndroidDeprecatedColor & {
    [key: string]: ColorValue;
};
export type AndroidBaseColorAttr = AndroidColorAttrSDK1 & AndroidColorAttrSDK5 & AndroidColorAttrSDK14 & AndroidColorAttrSDK21 & AndroidColorAttrSDK23 & AndroidColorAttrSDK25 & AndroidColorAttrSDK26 & {
    [key: string]: ColorValue;
};
export type AndroidMaterialColor = AndroidStaticMaterialColorType & {
    [key: string]: ColorValue;
};
export type AndroidDynamicMaterialColor = AndroidDynamicMaterialColorType & {
    [key: string]: ColorValue;
};
export interface ColorType {
    ios: IOSBaseColor & {
        [key: string]: ColorValue;
    };
    android: AndroidBaseColor & {
        attr: AndroidBaseColorAttr;
        material: AndroidMaterialColor;
        dynamic: AndroidDynamicMaterialColor;
    };
}
export declare const Color: ColorType;
//# sourceMappingURL=index.d.ts.map