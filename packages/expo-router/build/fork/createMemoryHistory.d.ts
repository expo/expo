import type { NavigationState } from '@react-navigation/core';
type HistoryRecord = {
    id: string;
    state: NavigationState;
    path: string;
};
export default function createMemoryHistory(): {
    readonly index: number;
    get(index: number): HistoryRecord;
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