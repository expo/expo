import * as React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
type Frame = {
    width: number;
    height: number;
};
export declare function useFrameSize<T>(selector: (frame: Frame) => T, throttle?: boolean): T;
type FrameSizeProviderProps = {
    initialFrame: Frame;
    render: (props: {
        ref: React.RefObject<View | null>;
        onLayout: (event: LayoutChangeEvent) => void;
    }) => React.ReactNode;
};
export declare function FrameSizeProvider({ initialFrame, render }: FrameSizeProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=useFrameSize.d.ts.map