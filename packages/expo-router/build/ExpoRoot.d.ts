import React, { type PropsWithChildren, type ComponentType } from 'react';
import { ExpoLinkingOptions } from './getLinkingConfig';
import { RequireContext } from './types';
export type ExpoRootProps = {
    context: RequireContext;
    location?: URL | string | undefined;
    wrapper?: ComponentType<PropsWithChildren> | undefined;
    linking?: Partial<ExpoLinkingOptions> | undefined;
};
export type NativeIntent = {
    redirectSystemPath?: ((event: {
        path: string | null;
        initial: boolean;
    }) => Promise<string | null | undefined> | string | null | undefined) | undefined;
};
/**
 * @hidden
 */
export declare function ExpoRoot({ wrapper: ParentWrapper, ...props }: ExpoRootProps): React.JSX.Element;
//# sourceMappingURL=ExpoRoot.d.ts.map