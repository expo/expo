import type { ReactNode } from 'react';
import React from 'react';
interface ActionsContextType {
    onMinimize: (() => void) | undefined;
    onReload: (() => void) | undefined;
    onCopyText: ((text: string) => void) | undefined;
}
export declare const ActionsContext: React.FC<{
    children: ReactNode;
} & ActionsContextType>;
export declare const withActions: (Component: React.FC, actions: ActionsContextType) => (props: any) => React.JSX.Element;
export declare const useActions: () => ActionsContextType;
export {};
