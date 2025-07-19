import { CommonViewModifierProps } from './types';
export interface ContentUnavailableViewProps extends CommonViewModifierProps {
    /**
     * A short title that describes why the content is not available.
     */
    title?: string;
    /**
     * SF Symbol indicating why the content is not available.
     */
    systemImage?: string;
    /**
     * Description of why the content is not available.
     */
    description?: string;
}
/**
 * Displays a native Swift UI ContentUnavailableView.
 * @platform ios 17.0+
 *
 */
export declare function ContentUnavailableView(props: ContentUnavailableViewProps): import("react").JSX.Element | null;
//# sourceMappingURL=ContentUnavailableView.d.ts.map