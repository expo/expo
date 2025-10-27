import { type ReactElement, type ReactNode } from 'react';
import { type ScreenProps } from './Screen';
export declare function isScreen(child: ReactNode, contextKey?: string): child is ReactElement<ScreenProps & {
    name: string;
}>;
//# sourceMappingURL=isScreen.d.ts.map