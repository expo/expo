import * as React from 'react';
type Props = {
    children: React.ReactNode;
};
export declare const SingleNavigatorContext: React.Context<{
    register(key: string): void;
    unregister(key: string): void;
} | undefined>;
/**
 * Component which ensures that there's only one navigator nested under it.
 */
export declare function EnsureSingleNavigator({ children }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=EnsureSingleNavigator.d.ts.map