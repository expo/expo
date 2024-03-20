import { type PropsWithChildren, type ComponentType } from 'react';
import { ExpoLinkingOptions } from './getLinkingConfig';
import { RequireContext } from './types';
export type ExpoRootProps = {
    context: RequireContext;
    location?: URL | string;
    wrapper?: ComponentType<PropsWithChildren>;
    linking?: Partial<ExpoLinkingOptions>;
};
export declare function ExpoRoot({ wrapper: ParentWrapper, ...props }: ExpoRootProps): JSX.Element;
//# sourceMappingURL=ExpoRoot.d.ts.map