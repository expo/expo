import { NativeModule, requireOptionalNativeModule } from 'expo';

/**
 * Crash kinds accepted by `triggerCrash`, named after the iOS triggers. Each maps
 * to the closest platform equivalent (see the native `CrashKind` enums).
 */
export type CrashKind =
  | 'badAccess'
  | 'fatalError'
  | 'divideByZero'
  | 'forceUnwrapNil'
  | 'arrayOutOfBounds'
  | 'objcException'
  | 'stackOverflow';

declare class CrashTesterModule extends NativeModule {
  /**
   * Intentionally crashes the app to exercise the crash-reporting pipeline.
   * Test-only — present on native builds, absent on web.
   */
  triggerCrash(kind: CrashKind): void;
}

export default requireOptionalNativeModule<CrashTesterModule>('CrashTester');
