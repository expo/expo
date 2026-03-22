import React from 'react';
import type { NativeStackOptions } from './types';
import type { NativeStackState } from './NativeStackRouter';
type Descriptor = {
    options: NativeStackOptions;
    render: () => React.ReactNode;
    route: {
        key: string;
        name: string;
    };
    navigation: any;
};
type Props = {
    state: NativeStackState;
    navigation: any;
    descriptors: Record<string, Descriptor>;
};
export declare function NativeStackView({ state, navigation, descriptors }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=NativeStackView.d.ts.map