import { type PropsWithChildren, type ComponentType } from 'react';
import { RequireContext } from './types';
export type ExpoRootProps = {
    context: RequireContext;
    location?: URL;
    wrapper?: ComponentType<PropsWithChildren>;
};
export declare function ExpoRoot({ wrapper: ParentWrapper, ...props }: ExpoRootProps): JSX.Element;
//# sourceMappingURL=ExpoRoot.d.ts.map