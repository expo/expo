import type { NavigationState } from '../core';
type HistoryRecord = {
    id: string;
    state: NavigationState;
    path: string;
};
/**
 * @deprecated Will be removed in a future SDK.
 */
export declare function createMemoryHistory(): {
    readonly index: number;
    get(index: number): HistoryRecord | undefined;
    backIndex({ path }: {
        path: string;
    }): number;
    push({ path, state }: {
        path: string;
        state: NavigationState;
    }): void;
    replace({ path, state }: {
        path: string;
        state: NavigationState;
    }): void;
    go(n: number): Promise<void> | undefined;
    listen(listener: () => void): () => void;
};
export {};
//# sourceMappingURL=createMemoryHistory.d.ts.map