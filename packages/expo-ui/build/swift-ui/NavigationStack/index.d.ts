import { type CommonViewModifierProps } from '../types';
export interface NavigationStackProps extends CommonViewModifierProps {
    /**
     * The root view of the stack. It is displayed inside a navigation bar.
     */
    children: React.ReactNode;
}
/**
 * A view that displays a root view and enables you to present additional views over the root view.
 *
 * @platform ios
 */
export declare function NavigationStack(props: NavigationStackProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map