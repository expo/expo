import React, { ReactNode } from 'react';
interface ActionsContextType {
    onMinimize: (() => void) | undefined;
}
export declare const ActionsProvider: React.FC<{
    children: ReactNode;
} & ActionsContextType>;
export declare const withActions: (Component: React.FC, actions: ActionsContextType) => (props: any) => React.JSX.Element;
export declare const useActions: () => ActionsContextType;
export {};
