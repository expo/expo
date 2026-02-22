"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = void 0;
const react_native_1 = require("react-native");
const materialColor_1 = require("./materialColor");
__exportStar(require("./android.color.types"), exports);
__exportStar(require("./android.attr.types"), exports);
__exportStar(require("./android.dynamic.types"), exports);
__exportStar(require("./android.material.types"), exports);
__exportStar(require("./ios.types"), exports);
const iosColor = new Proxy({}, {
    get(_, prop) {
        if (process.env.EXPO_OS === 'ios') {
            return (0, react_native_1.PlatformColor)(prop);
        }
        return null;
    },
});
const androidAttrColor = new Proxy({}, {
    get(_, prop) {
        if (process.env.EXPO_OS === 'android') {
            return (0, react_native_1.PlatformColor)('?attr/' + prop);
        }
        return null;
    },
});
const androidMaterialColor = new Proxy({}, {
    get(_, prop) {
        if (process.env.EXPO_OS === 'android') {
            return (0, materialColor_1.Material3Color)(prop);
        }
        return null;
    },
});
const androidDynamicColor = new Proxy({}, {
    get(_, prop) {
        if (process.env.EXPO_OS === 'android') {
            return (0, materialColor_1.Material3DynamicColor)(prop);
        }
        return null;
    },
});
const androidColor = new Proxy({
    get attr() {
        return androidAttrColor;
    },
    get material() {
        return androidMaterialColor;
    },
    get dynamic() {
        return androidDynamicColor;
    },
}, {
    get(target, prop) {
        if (prop in target) {
            return target[prop];
        }
        if (process.env.EXPO_OS === 'android') {
            return (0, react_native_1.PlatformColor)('@android:color/' + prop);
        }
        return null;
    },
});
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
exports.Color = {
    get ios() {
        return iosColor;
    },
    get android() {
        return androidColor;
    },
};
//# sourceMappingURL=index.js.map