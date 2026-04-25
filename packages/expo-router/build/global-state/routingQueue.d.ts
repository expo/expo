import type { RefObject } from 'react';
import type { LinkToOptions } from './types';
import type { NavigationAction, ParamListBase, NavigationContainerRef } from '../react-navigation/native';
export interface LinkAction {
    type: 'ROUTER_LINK';
    payload: {
        options: LinkToOptions;
        href: string;
    };
}
export declare const routingQueue: {
    queue: (NavigationAction | LinkAction)[];
    subscribers: Set<() => void>;
    subscribe(callback: () => void): () => void;
    snapshot(): (Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }> | LinkAction)[];
    add(action: NavigationAction | LinkAction): void;
    run(ref: RefObject<NavigationContainerRef<ParamListBase> | null>): void;
};
//# sourceMappingURL=routingQueue.d.ts.map