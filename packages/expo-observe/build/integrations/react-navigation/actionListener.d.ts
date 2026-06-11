import type { ReactNavigationIntegrationStorage } from './storage';
export interface NavigationRefActionListenerHandle {
    addListener(event: '__unsafe_action__', cb: (e: {
        data: {
            action: {
                type: string;
                payload?: object;
            };
            noop: boolean;
        };
    }) => void): () => void;
}
export declare function attachActionListener(navigationRef: NavigationRefActionListenerHandle, storage: ReactNavigationIntegrationStorage): () => void;
//# sourceMappingURL=actionListener.d.ts.map