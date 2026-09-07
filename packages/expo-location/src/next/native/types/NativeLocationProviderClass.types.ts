import { SharedObject } from 'expo';
import type { SharedRef } from 'expo';

import type { LocationProviderRefType } from '../../types';

export declare class NativeLocationProviderClass extends SharedObject {
  static Gms(): SharedRef<LocationProviderRefType>;
  static Android(): SharedRef<LocationProviderRefType>;
  static Fallback(providers: SharedRef<LocationProviderRefType>[]): SharedRef<LocationProviderRefType>;
}
