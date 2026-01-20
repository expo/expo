import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type PropsWithChildren } from 'react';
import { StackScreenTitle, StackScreenBackButton } from './screen';
export interface StackScreenProps extends PropsWithChildren {
    name?: string;
    options?: NativeStackNavigationOptions;
}
export declare function StackScreen({ children, options, ...rest }: StackScreenProps): import("react").JSX.Element;
export declare namespace StackScreen {
    var Title: typeof StackScreenTitle;
    var BackButton: typeof StackScreenBackButton;
}
export declare function appendScreenStackPropsToOptions(options: NativeStackNavigationOptions, props: StackScreenProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackScreen.d.ts.map