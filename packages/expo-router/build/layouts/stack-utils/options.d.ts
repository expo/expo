import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type ReactElement } from 'react';
import type { StackScreenProps } from './types';
export declare function appendScreenStackPropsToOptions(options: NativeStackNavigationOptions, props: StackScreenProps): NativeStackNavigationOptions;
export declare function isChildOfType<PropsT>(element: React.ReactNode, type: (props: PropsT) => unknown): element is ReactElement<PropsT>;
//# sourceMappingURL=options.d.ts.map