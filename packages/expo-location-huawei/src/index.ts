import type { SharedRef } from 'expo';
import { NativeModule, requireNativeModule } from 'expo';

declare class HmsModule extends NativeModule {
  get(): SharedRef<'LocationProvider'>;
}

const hmsModule = requireNativeModule<HmsModule>('HmsModule');

export function getHmsLocationProvider(): SharedRef<'LocationProvider'> {
  return hmsModule.get();
}
