package expo.modules.kotlin.jni

import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

class WorkletRuntimeInstaller(
  val runtime: Runtime
) {
  fun install(
    jsRuntimePointer: Long
  ): JSIContext {
    return install(
      runtime.weak(),
      jsRuntimePointer,
      runtime.deallocator
    )
  }

  private external fun install(
    runtimeContextHolder: WeakReference<Any>,
    jsRuntimePointer: Long,
    jniDeallocator: JNIDeallocator
  ): JSIContext

  companion object {
    /**
     * Resolves the raw UI `jsi::Runtime*` (as a Long) from a `react-native-worklets`
     * UI runtime holder. Returns 0 when worklets isn't installed or the holder
     * doesn't wrap a worklet runtime.
     */
    @JvmStatic
    @Suppress("KotlinJniMissingFunction")
    external fun resolveUIRuntimePointer(uiRuntimeHolder: JavaScriptObject): Long
  }
}
