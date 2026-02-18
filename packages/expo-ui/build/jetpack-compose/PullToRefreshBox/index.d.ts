import { type ExpoModifier } from '../../types';
export type PullToRefreshBoxProps = {
    /**
     * Whether the content is refreshing.
     * @default false
     */
    isRefreshing?: boolean;
    /**
     * Callback to call when the content is refreshed.
     */
    onRefresh?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
    /**
     * Modifiers for the loading indicator.
     * @default [align('topCenter'), padding(0, 10, 0, 0)]
     */
    loadingIndicatorModifiers?: ExpoModifier[];
    /**
     * The content to refresh.
     */
    children: React.ReactNode;
};
/**
 * Renders a `PullToRefreshBox` component.
 * A box that allows the user to pull down to refresh the content.
 */
export declare function PullToRefreshBox(props: PullToRefreshBoxProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map