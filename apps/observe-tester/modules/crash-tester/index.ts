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
  /** Sleeps on the main thread, to cause an app hang on iOS or an ANR on Android. */
  blockMainThread(seconds: number): void;
  /**
   * Allocates on the Java heap until an `OutOfMemoryError` crashes the app.
   * @platform android
   */
  exhaustJavaHeap?(): void;
  /**
   * Allocates native memory until the system kills the app.
   * @platform android
   */
  fillNativeMemory?(): void;
}

export default requireOptionalNativeModule<CrashTesterModule>('CrashTester');
