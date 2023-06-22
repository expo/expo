import { EventSubscription } from 'fbemitter';
import { UseUpdatesEvent } from './UseUpdates.types';
export declare const emitEvent: (event: UseUpdatesEvent) => void;
export declare const useUpdateEvents: (listener: (event: UseUpdatesEvent) => void) => void;
export declare const addUpdatesStateChangeListener: (listener: (event: any) => void) => EventSubscription;
//# sourceMappingURL=UseUpdatesEmitter.d.ts.map