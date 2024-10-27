import { DependencyList } from 'react';
import type { SharedObject } from '../ts-declarations/SharedObject';
/**
 * Returns a shared object, which is automatically cleaned up when the component is unmounted.
 */
export declare function useReleasingSharedObject<TSharedObject extends SharedObject>(factory: () => TSharedObject, dependencies: DependencyList): TSharedObject;
//# sourceMappingURL=useReleasingSharedObject.d.ts.map