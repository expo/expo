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
}
