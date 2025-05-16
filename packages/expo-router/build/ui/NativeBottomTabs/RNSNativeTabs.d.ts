import React from 'react';
import { type ColorValue, type ViewProps } from 'react-native';
import { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
type TabBarAppearance = Readonly<{
    backgroundColor?: ColorValue;
}>;
type BlurEffect = 'none' | 'extraLight' | 'light' | 'dark' | 'regular' | 'prominent' | 'systemUltraThinMaterial' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial' | 'systemChromeMaterial' | 'systemUltraThinMaterialLight' | 'systemThinMaterialLight' | 'systemMaterialLight' | 'systemThickMaterialLight' | 'systemChromeMaterialLight' | 'systemUltraThinMaterialDark' | 'systemThinMaterialDark' | 'systemMaterialDark' | 'systemThickMaterialDark' | 'systemChromeMaterialDark';
export interface NativeProps extends ViewProps {
    tabBarAppearance?: TabBarAppearance;
    tabBarBackgroundColor?: ColorValue;
    tabBarBlurEffect?: WithDefault<BlurEffect, 'none'>;
}
export declare function RNSNativeTabs(props: NativeProps): React.JSX.Element;
export {};
//# sourceMappingURL=RNSNativeTabs.d.ts.map