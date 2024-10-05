import { type DependencyList, type Ref } from 'react';
import type { DOMImperativeFactory } from './dom.types';
/**
 * A React `useImperativeHandle` like hook for DOM components.
 *
 */
export declare function useDOMImperativeHandle<T extends DOMImperativeFactory>(ref: Ref<T>, init: () => T, deps?: DependencyList): void;
//# sourceMappingURL=dom-hooks.d.ts.map