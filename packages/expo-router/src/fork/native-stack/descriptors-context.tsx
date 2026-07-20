import { createContext } from 'react';
import type { NavigatorDescriptor } from 'standard-navigation';

import type { NativeStackNavigationOptions } from '../../react-navigation/native-stack';

export type NativeStackDescriptor = NavigatorDescriptor<NativeStackNavigationOptions>;

export type NativeStackDescriptorMap = {
  [key: string]: NativeStackDescriptor;
};

export const DescriptorsContext = createContext<NativeStackDescriptorMap>({});
