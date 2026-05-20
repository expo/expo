import type { EventConsumer, EventEmitter } from './types';
export type NavigationEventEmitter<T extends Record<string, any>> = EventEmitter<T> & {
    create: (target: string) => EventConsumer<T>;
};
/**
 * Hook to manage the event system used by the navigator to notify screens of various events.
 */
export declare function useEventEmitter<T extends Record<string, any>>(listen?: (e: any) => void): NavigationEventEmitter<T>;
//# sourceMappingURL=useEventEmitter.d.ts.map