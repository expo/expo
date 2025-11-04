import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type PropsWithChildren } from 'react';
export interface StackScreenProps extends PropsWithChildren {
    name?: string;
    options?: NativeStackNavigationOptions;
}
export declare function StackScreen({ children, options, ...rest }: StackScreenProps): import("react").JSX.Element;
export declare function appendScreenStackPropsToOptions(options: NativeStackNavigationOptions, props: StackScreenProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackScreen.d.ts.map