import type { NavigationAction } from '../routers';
/**
 * Hook to prevent screen from being removed. Can be used to prevent users from leaving the screen.
 *
 * @param preventRemove Boolean indicating whether to prevent screen from being removed.
 * @param callback Function which is executed when screen was prevented from being removed.
 */
export declare function usePreventRemove(preventRemove: boolean, callback: (options: {
    data: {
        action: NavigationAction;
    };
}) => void): void;
//# sourceMappingURL=usePreventRemove.d.ts.map