import React from 'react';
import { RouteNode } from '../Route';
/**
 * Props passed to a route's `SuspenseFallback` export.
 *
 * @privateRemarks This type intentionally differs from the `<SuspenseFallback>` component's props
 * below since the `RouteNode` type isn't generally meant for public consumption.
 */
export type SuspenseFallbackProps = {
    /**
     * The route module's `contextKey`
     *
     * @example `./index.tsx`
     * @example `./profile/[id].tsx`
     */
    route: string;
};
export declare function SuspenseFallback({ route }: {
    route: RouteNode;
}): React.JSX.Element | null;
//# sourceMappingURL=SuspenseFallback.d.ts.map