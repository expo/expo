package expo.modules.kotlin.jni.worklets

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.jni.Destructible
import expo.modules.kotlin.runtime.WorkletRuntimeContext

class Worklet @DoNotStrip private constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  private val WorkletRuntimeContext.enforceHolder
    get() = workletRuntimeHolder
      ?: throw IllegalStateException("Worklet runtime is not installed.")

  fun schedule(runtime: WorkletRuntimeContext) {
    val runtimeHolder = runtime.enforceHolder
    schedule(runtimeHolder)
  }

  fun execute(runtime: WorkletRuntimeContext) {
    val runtimeHolder = runtime.enforceHolder
    execute(runtimeHolder)
  }

  private external fun schedule(
    workletRuntimeHolder: WorkletRuntimeHolder
  )

  private external fun execute(
    workletRuntimeHolder: WorkletRuntimeHolder
  )

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }
}
