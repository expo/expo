package expo.modules.kotlin.jni.worklets

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.jni.Destructible
import expo.modules.kotlin.runtime.WorkletRuntime

class Worklet @DoNotStrip private constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  private val WorkletRuntime.enforceHolder
    get() = mWorkletNativeRuntime
      ?: throw IllegalStateException("Worklet runtime is not installed.")

  fun schedule(runtime: WorkletRuntime) {
    val runtimeHolder = runtime.enforceHolder
    schedule(runtimeHolder)
  }

  fun execute(runtime: WorkletRuntime) {
    val runtimeHolder = runtime.enforceHolder
    execute(runtimeHolder)
  }

  private external fun schedule(
    workletNativeRuntime: WorkletNativeRuntime
  )

  private external fun execute(
    workletNativeRuntime: WorkletNativeRuntime
  )

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }
}
