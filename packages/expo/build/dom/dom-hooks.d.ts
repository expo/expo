import { type DependencyList } from 'react';
import type { DOMImperativeFactory } from './dom.types';
/**
 * A React `useImperativeHandle` like hook for DOM components.
 *
 */
export declare function useDomImperativeHandle<T extends DOMImperativeFactory>(init: () => T, deps?: DependencyList): void;
//# sourceMappingURL=dom-hooks.d.ts.map