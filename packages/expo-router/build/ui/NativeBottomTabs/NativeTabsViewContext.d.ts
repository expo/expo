import React, { type ReactNode } from 'react';
import { type ViewProps } from 'react-native';
type BottomTabAccessoryContextType = {
    bottomTabAccessory: Record<string, ViewProps>;
    setBottomTabAccessory: (tabKey: string, node: ViewProps) => void;
    removeBottomTabAccessory: (tabKey: string) => void;
};
export declare const BottomTabAccessoryProvider: ({ children }: {
    children: ReactNode;
}) => React.JSX.Element;
export declare const useBottomTabAccessory: () => BottomTabAccessoryContextType;
export {};
//# sourceMappingURL=NativeTabsViewContext.d.ts.map