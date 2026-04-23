import * as React from 'react';
import { type ServerContextType } from './ServerContext';
import type { ServerContainerRef } from './types';
type Props = ServerContextType & {
    children: React.ReactNode;
};
/**
 * Container component for server rendering.
 *
 * @param props.location Location object to base the initial URL for SSR.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which contains helper methods.
 */
export declare function ServerContainer({ ref, children, location, }: Props & {
    ref?: React.Ref<ServerContainerRef>;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ServerContainer.d.ts.map