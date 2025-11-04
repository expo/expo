import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
import { type ColorValue, type StyleProp } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';
export interface StackHeaderProps {
    children?: ReactNode;
    hidden?: boolean;
    asChild?: boolean;
    blurEffect?: ScreenStackHeaderConfigProps['blurEffect'];
    style?: StyleProp<{
        color?: ColorValue;
        backgroundColor?: ScreenStackHeaderConfigProps['backgroundColor'];
        shadowColor?: undefined | 'transparent';
    }>;
    largeStyle?: StyleProp<{
        backgroundColor?: ScreenStackHeaderConfigProps['largeTitleBackgroundColor'];
        shadowColor?: undefined | 'transparent';
    }>;
}
export declare function StackHeaderComponent(props: StackHeaderProps): null;
export declare function appendStackHeaderPropsToOptions(options: NativeStackNavigationOptions, props: StackHeaderProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackHeaderComponent.d.ts.map