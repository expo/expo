import React, { Component, type ComponentType, type PropsWithChildren } from 'react';
/** Props passed to a page's `ErrorBoundary` export. */
export type ErrorBoundaryProps = {
    /** Retry rendering the component by clearing the `error` state. */
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
    };
    retry: () => Promise<void>;
    render(): string | number | boolean | React.ReactFragment | JSX.Element | null | undefined;
}
//# sourceMappingURL=Try.d.ts.map