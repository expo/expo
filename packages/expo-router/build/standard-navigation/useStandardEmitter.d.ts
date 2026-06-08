import { type NavigatorArgs } from 'standard-navigation';
import type { StandardNavigatorEventMapBase } from './types';
import { type EventEmitter } from '../react-navigation/core';
export declare function useStandardEmitter<NavigatorEventMap extends StandardNavigatorEventMapBase>(navigation: EventEmitter<NavigatorEventMap>): NavigatorArgs<Record<string, never>, NavigatorEventMap>['emitter'];
//# sourceMappingURL=useStandardEmitter.d.ts.map