import React from 'react';
/**
 * Props passed to a route's `SuspenseFallback` export.
 */
export type SuspenseFallbackProps = {
    /**
     * The route module's `contextKey`.
     *
     * @example
     * `./index.tsx`
     * `./profile/[id].tsx`
     */
    route: string;
    /**
     * The route's URL parameters.
     *
     * @example
     *
     */
    params: Record<string, string | string[]>;
};
export declare function SuspenseFallback({ route }: SuspenseFallbackProps): React.JSX.Element | null;
//# sourceMappingURL=SuspenseFallback.d.ts.map