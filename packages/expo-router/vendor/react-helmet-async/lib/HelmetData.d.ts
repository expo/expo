import type HelmetDispatcher from './Dispatcher';
import type { HelmetServerState } from './types';
export declare function clearInstances(): void;
export interface HelmetDataType {
    instances: HelmetDispatcher[];
    context: HelmetDataContext;
}
interface HelmetDataContext {
    helmet: HelmetServerState;
}
export declare const isDocument: boolean;
export default class HelmetData implements HelmetDataType {
    instances: any[];
    canUseDOM: boolean;
    context: HelmetDataContext;
    value: {
        setHelmet: (serverState: HelmetServerState) => void;
        helmetInstances: {
            get: () => any[];
            add: (instance: HelmetDispatcher) => void;
            remove: (instance: HelmetDispatcher) => void;
        };
    };
    constructor(context: any, canUseDOM?: boolean);
}
export {};
