import type { ComponentType, JSX, PropsWithChildren } from 'react';
import type { ExpoRootProps } from '../ExpoRoot';
import type { RequireContext } from '../types';
type InitialProps = {
    location: URL;
    context: RequireContext;
    wrapper: ComponentType<PropsWithChildren>;
};
export declare function registerStaticRootComponent<P extends InitialProps>(component: (props: ExpoRootProps) => JSX.Element, initialProps: P): any;
export {};
//# sourceMappingURL=registerRootComponent.d.ts.map