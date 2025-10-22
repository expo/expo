import React, { type PropsWithChildren, type ReactNode } from 'react';
import { type TextStyle } from 'react-native';
interface StackWithButtonsProps extends PropsWithChildren {
}
declare function StackHeaderComponent(props: PropsWithChildren): null;
declare function StackHeaderLeft(props: PropsWithChildren): null;
declare function StackHeaderRight(props: PropsWithChildren): null;
declare function StackHeaderButton(props: {
    children?: ReactNode;
    onPress?: () => void;
    style?: TextStyle;
}): null;
declare function StackHeaderTitle(props: {
    children?: string;
    style?: TextStyle;
    largeStyle?: TextStyle;
    large?: boolean;
}): null;
export declare const StackHeader: typeof StackHeaderComponent & {
    Left: typeof StackHeaderLeft;
    Right: typeof StackHeaderRight;
    Button: typeof StackHeaderButton;
    BackButton: typeof StackHeaderButton;
    Title: typeof StackHeaderTitle;
};
declare function StackWithButtonsComponent(props: StackWithButtonsProps): React.JSX.Element;
export declare const StackWithButtons: typeof StackWithButtonsComponent & {
    Header: typeof StackHeaderComponent & {
        Left: typeof StackHeaderLeft;
        Right: typeof StackHeaderRight;
        Button: typeof StackHeaderButton;
        BackButton: typeof StackHeaderButton;
        Title: typeof StackHeaderTitle;
    };
};
export {};
//# sourceMappingURL=StackWithButtons.d.ts.map