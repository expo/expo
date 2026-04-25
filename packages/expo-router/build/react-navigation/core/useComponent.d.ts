import * as React from 'react';
type Render = (children: React.ReactNode) => React.JSX.Element;
export declare function useComponent(render: Render): ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=useComponent.d.ts.map