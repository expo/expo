import { JSX, ReactNode } from 'react';
import { ScreenProps } from '../useScreens';
export type ScreenPropsWithName = ScreenProps & {
    name: string;
};
/**
 * Groups a navigator's children into screens and custom children.
 */
export declare function useGroupNavigatorChildren(children: ReactNode, { isCustomNavigator, contextKey, processor, }?: {
    /** Allow non-<Screen /> children */
    isCustomNavigator?: boolean;
    /** Used for sending developer hints */
    contextKey?: string;
    /** Manually process screen children */
    processor?: (options: ScreenPropsWithName[]) => ScreenPropsWithName[];
}): {
    screens: JSX.Element[];
    children: any[];
};
//# sourceMappingURL=useGroupNavigatorChildren.d.ts.map