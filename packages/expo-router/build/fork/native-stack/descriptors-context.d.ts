import type { Descriptor, ParamListBase, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
export type NativeStackDescriptor = Descriptor<NativeStackNavigationOptions, NativeStackNavigationProp<ParamListBase>, RouteProp<ParamListBase>>;
export type NativeStackDescriptorMap = {
    [key: string]: NativeStackDescriptor;
};
export declare const DescriptorsContext: import("react").Context<NativeStackDescriptorMap>;
//# sourceMappingURL=descriptors-context.d.ts.map