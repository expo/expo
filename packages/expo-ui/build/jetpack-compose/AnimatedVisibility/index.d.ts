import { PrimitiveBaseProps } from '../layout-types';
export type AnimatedVisibilityProps = {
    children?: React.ReactNode;
    /**
     * Whether the content is visible. When changed, the content will animate in or out
     * using the default Compose transitions (fadeIn + expandIn / fadeOut + shrinkOut).
     */
    visible: boolean;
} & PrimitiveBaseProps;
export declare function AnimatedVisibility(props: AnimatedVisibilityProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map