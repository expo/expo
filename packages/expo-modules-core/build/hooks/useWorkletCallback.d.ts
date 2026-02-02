import { DependencyList } from 'react';
/**
 * Wraps a worklet function in a `WorkletCallback` SharedObject and returns its numeric ID,
 * which can be passed as a prop through React Native's serialization.
 */
export declare function useWorkletCallback(workletFn: ((...args: any[]) => any) | undefined, deps: DependencyList): number | undefined;
//# sourceMappingURL=useWorkletCallback.d.ts.map