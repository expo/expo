import { createContext } from 'react';

import type { Descriptor, ParamListBase, RouteProp } from '../../react-navigation/native';
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from '../../react-navigation/native-stack';

// Copied from @react-navigation/native
export type NativeStackDescriptor = Descriptor<
  NativeStackNavigationOptions,
  NativeStackNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

export type NativeStackDescriptorMap = {
  [key: string]: NativeStackDescriptor;
};

export const DescriptorsContext = createContext<NativeStackDescriptorMap>({});
