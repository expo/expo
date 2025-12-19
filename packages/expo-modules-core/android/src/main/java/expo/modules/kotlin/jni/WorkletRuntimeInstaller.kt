package expo.modules.kotlin.jni

import expo.modules.kotlin.runtime.RuntimeContext
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

class WorkletRuntimeInstaller(
  val runtimeContext: RuntimeContext
) {
  fun install(
    jsRuntimePointer: Long
  ): JSIContext {
    return install(
      runtimeContext.weak(),
      jsRuntimePointer,
      runtimeContext.deallocator
    )
  }

  private external fun install(
    runtimeContextHolder: WeakReference<Any>,
    jsRuntimePointer: Long,
    jniDeallocator: JNIDeallocator
  ): JSIContext
}
