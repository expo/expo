import * as React from 'react';
type Props = {
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
export declare const CardA11yWrapper: React.ForwardRefExoticComponent<Props & React.RefAttributes<CardA11yWrapperRef>>;
export {};
//# sourceMappingURL=CardA11yWrapper.d.ts.map