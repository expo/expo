import { type NativeStackState } from './NativeStackRouter';
import type { NativeStackNavigationEventMap, NativeStackOptions, NativeStackProps } from './types';
export declare function NativeStackNavigator({ children, screenListeners, screenOptions, }: NativeStackProps): import("react").JSX.Element;
export declare const NativeStackWithContext: import("react").ForwardRefExoticComponent<Omit<NativeStackProps, "children"> & Partial<Pick<NativeStackProps, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<NativeStackOptions, NativeStackState, NativeStackNavigationEventMap>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
//# sourceMappingURL=NativeStackNavigator.d.ts.map