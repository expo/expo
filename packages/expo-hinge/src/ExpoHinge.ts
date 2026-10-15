import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { ExpoHingeModuleEvents, Hinge } from './Hinge.types';

declare class ExpoHingeModule extends NativeModule<ExpoHingeModuleEvents> {
  isAvailable: boolean;
  getHinge(): Hinge | null;
}

// `null` on web, where the package has no native module.
export default requireOptionalNativeModule<ExpoHingeModule>('ExpoHinge');
