import * as React from 'react';
type Props = {
    ref?: React.Ref<CardA11yWrapperRef>;
    focused: boolean;
    active: boolean;
    animated: boolean;
    isNextScreenTransparent: boolean;
    detachCurrentScreen: boolean;
    children: React.ReactNode;
};
export type CardA11yWrapperRef = {
    setInert: (value: boolean) => void;
};
export declare const CardA11yWrapper: ({ ref, focused, active, animated, isNextScreenTransparent, detachCurrentScreen, children, }: Props) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CardA11yWrapper.d.ts.map