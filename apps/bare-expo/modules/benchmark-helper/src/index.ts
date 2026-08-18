import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'expo-modules-core';

declare class BenchmarkHelperModule extends NativeModule {
  reportFullyDrawn(): void;
}

const noop: BenchmarkHelperModule = {
  reportFullyDrawn() {},
} as unknown as BenchmarkHelperModule;

export default Platform.OS === 'android'
  ? requireNativeModule<BenchmarkHelperModule>('BenchmarkHelperModule')
  : noop;
