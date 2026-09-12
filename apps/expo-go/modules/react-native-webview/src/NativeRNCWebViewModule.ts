import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { Double } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  shouldStartLoadWithLockIdentifier(shouldStart: boolean, lockIdentifier: Double): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCWebViewModule');
