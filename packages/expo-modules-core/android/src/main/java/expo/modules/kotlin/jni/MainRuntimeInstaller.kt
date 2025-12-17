package expo.modules.kotlin.jni

import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.soloader.SoLoader
import expo.modules.kotlin.runtime.RuntimeContext
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

@OptIn(FrameworkAPI::class)
class MainRuntimeInstaller(
  val runtimeContext: RuntimeContext
) {
  // TODO(@lukmccall): Migrate tests to use bridgeless JSI installation and remove this method.
  fun install(
    jsRuntimePointer: Long,
    jsInvokerHolder: CallInvokerHolderImpl
  ): JSIContext {
    return install(
      runtimeContext.weak(),
      jsRuntimePointer,
      runtimeContext.deallocator,
      jsInvokerHolder
    )
  }

  fun install(
    jsRuntimePointer: Long,
    runtimeExecutor: RuntimeExecutor
  ): JSIContext {
    return install(
      runtimeContext.weak(),
      jsRuntimePointer,
      runtimeContext.deallocator,
      runtimeExecutor
    )
  }

  private external fun install(
    runtimeContextHolder: WeakReference<Any>,
    jsRuntimePointer: Long,
    jniDeallocator: JNIDeallocator,
    jsInvokerHolder: CallInvokerHolderImpl
  ): JSIContext

  private external fun install(
    runtimeContextHolder: WeakReference<Any>,
    jsRuntimePointer: Long,
    jniDeallocator: JNIDeallocator,
    runtimeExecutor: RuntimeExecutor
  ): JSIContext

  companion object {
    init {
      SoLoader.loadLibrary("expo-modules-core")
    }
  }
}
