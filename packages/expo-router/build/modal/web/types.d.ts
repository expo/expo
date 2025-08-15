import { ParamListBase, StackActionHelpers, StackNavigationState, StackRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import { NativeStackNavigationEventMap, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
export type ModalStackNavigatorProps = {
    initialRouteName?: string;
    screenOptions?: ExtendedStackNavigationOptions;
    children: React.ReactNode;
};
export type ModalStackViewProps = Omit<ReturnType<typeof useNavigationBuilder<StackNavigationState<ParamListBase>, StackRouterOptions, StackActionHelpers<ParamListBase>, NativeStackNavigationOptions, NativeStackNavigationEventMap>>, 'NavigationContent'>;
export type CSSWithVars = React.CSSProperties & {
    [key: `--${string}`]: string | number;
};
export type PresentationOptions = Partial<Pick<ExtendedStackNavigationOptions, 'presentation'>>;
//# sourceMappingURL=types.d.ts.map