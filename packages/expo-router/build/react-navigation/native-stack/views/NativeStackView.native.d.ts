import type { NativeStackDescriptorMap, NativeStackEmit, NativeStackViewState } from '../types';
type Props = {
    state: NativeStackViewState;
    descriptors: NativeStackDescriptorMap;
    emit: NativeStackEmit;
    pop: (count: number, sourceRouteKey: string) => void;
};
export declare function NativeStackView({ state, descriptors, emit, pop }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=NativeStackView.native.d.ts.map