import { FunctionComponent, ReactElement, ReactNode } from 'react';
export type ProtectedProps = {
    guard: boolean;
    children?: ReactNode;
};
export declare const Protected: FunctionComponent<ProtectedProps>;
export declare function isProtectedReactElement(child: ReactNode): child is ReactElement<ProtectedProps>;
//# sourceMappingURL=Protected.d.ts.map