import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
import { type ContentAlignment } from '../layout-types';
/**
 * Configuration for the loading indicator shown during pull-to-refresh.
 */
export type PullToRefreshIndicatorProps = {
    /**
     * Color of the loading indicator spinner.
     * @default MaterialTheme.colorScheme.primary
     */
    color?: ColorValue;
    /**
     * Background color of the loading indicator container.
     * @default MaterialTheme.colorScheme.surfaceContainerHigh
     */
    containerColor?: ColorValue;
    /**
     * Modifiers for the loading indicator.
     */
    modifiers?: ModifierConfig[];
};
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
     * Configuration for the loading indicator shown during pull-to-refresh.
     */
    indicator?: PullToRefreshIndicatorProps;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
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