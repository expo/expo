import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
import { type ContentAlignment } from '../layout-types';
export type PullToRefreshBoxProps = {
    /**
     * Whether the content is refreshing.
     * @default false
     */
    isRefreshing?: boolean;
    /**
     * Callback that is called when the user pulls to refresh.
     */
    onRefresh?: () => void;
    /**
     * Alignment of children within the box.
     * @default 'topStart'
     */
    contentAlignment?: ContentAlignment;
    /**
     * Color of the loading indicator spinner.
     */
    indicatorColor?: ColorValue;
    /**
     * Background color of the loading indicator container.
     */
    indicatorContainerColor?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Modifiers for the loading indicator.
     */
    loadingIndicatorModifiers?: ModifierConfig[];
    /**
     * The content to refresh.
     */
    children: React.ReactNode;
};
/**
 * A pull-to-refresh container that wraps scrollable content and shows a refresh indicator when pulled,
 * matching Compose's `PullToRefreshBox`.
 */
export declare function PullToRefreshBox(props: PullToRefreshBoxProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map