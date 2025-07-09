import { JSX } from 'react';
/**
 * Copied from @react-navigation/core
 */
type Render = (children: React.ReactNode) => JSX.Element;
export declare function useComponent(render: Render): import("react").ForwardRefExoticComponent<{
    children: React.ReactNode;
} & import("react").RefAttributes<unknown>>;
export {};
//# sourceMappingURL=useComponent.d.ts.map