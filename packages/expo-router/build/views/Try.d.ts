import React, { Component, type ComponentType, type PropsWithChildren } from 'react';
/** Props passed to a page's `ErrorBoundary` export. */
export type ErrorBoundaryProps = {
    /** A function that will re-render the route component by clearing the `error` state. */
    retry: () => Promise<void>;
    /** The error that was thrown. */
    error: Error;
};
export declare class Try extends Component<PropsWithChildren<{
    catch: ComponentType<ErrorBoundaryProps>;
}>, {
    error?: Error;
}> {
    state: {
        error: undefined;
    };
    static getDerivedStateFromError(error: Error): {
        error: Error;
    } | null;
    retry: () => Promise<void>;
    render(): string | number | bigint | boolean | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | React.JSX.Element | null | undefined;
}
//# sourceMappingURL=Try.d.ts.map