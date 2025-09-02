import { EventsMap } from './ts-declarations/EventEmitter';
import type { ExpoGlobal } from './ts-declarations/global';
export type SharedObject<TEventsMap extends EventsMap = Record<never, never>> = typeof ExpoGlobal.SharedObject<TEventsMap>;
export declare const SharedObject: typeof ExpoGlobal.SharedObject;
//# sourceMappingURL=SharedObject.d.ts.map