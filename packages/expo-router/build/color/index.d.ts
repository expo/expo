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
/**
 * Color utility to access platform-specific colors easily.
 *
 * On **Android**, it provides access to:
 * - System colors, as a type-safe wrapper over `PlatformColor`. For example, `Color.android.background`.
 * - Attribute colors, as a type-safe wrapper over `PlatformColor`. For example, `Color.android.attr.colorPrimary`.
 * - [Material Design 3 static colors](https://m3.material.io/styles/color/static/baseline). For example, `Color.android.material.primary`.
 * - [Material Design 3 dynamic colors](https://m3.material.io/styles/color/dynamic/user-generated-source). For example, `Color.android.dynamic.primary`.
 *
 * On **iOS**, it is a type-safe wrapper over `PlatformColor`, providing access to system colors. For example, `Color.ios.label`.
 *
 * > **Note**: To ensure the colors align with the system theme on Android, make sure they are used within a component that responds to theme changes, such as by using the `useColorScheme` hook from React Native. This is especially important when using React Compiler, which can memoize components.
 *
 * @example
 * ```tsx
 * import { Color } from 'expo-router';
 *
 * Color.ios.label; // Access iOS system color
 * Color.android.background; // Access Android system color
 * Color.android.attr.colorPrimary; // Access Android attribute color
 * Color.android.material.primary; // Access Android Material Design 3 static color
 * Color.android.dynamic.primary; // Access Android Material Design 3 dynamic color
 * ```
 *
 * @example
 * ```tsx
 * import { Color } from 'expo-router';
 * import { View, Text, useColorScheme } from 'react-native';
 *
 * export default function MyComponent() {
 *   useColorScheme(); // Ensure the app responds to system theme changes
 *   return (
 *     <View style={{ flex: 1, backgroundColor: Color.android.dynamic.primary }}>
 *       <Text style={{ color: Color.android.dynamic.onPrimary }}>
 *         Hello, World!
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * @platform android
 * @platform ios
 */
export declare const Color: ColorType;
//# sourceMappingURL=index.d.ts.map