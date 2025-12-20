package expo.modules.kotlin.jni.worklets

import expo.modules.kotlin.runtime.WorkletRuntime

class Worklet internal constructor(
  private val serializable: Serializable
){
  private val WorkletRuntime.enforceHolder
    get() = mWorkletNativeRuntime
      ?: throw IllegalStateException("Worklet runtime is not installed.")

  fun schedule(runtime: WorkletRuntime) {
    val runtimeHolder = runtime.enforceHolder
    schedule(runtimeHolder, serializable)
  }

  fun execute(runtime: WorkletRuntime) {
    val runtimeHolder = runtime.enforceHolder
    execute(runtimeHolder, serializable)
  }

  private external fun schedule(
    workletNativeRuntime: WorkletNativeRuntime,
    serializable: Serializable
  )

  private external fun execute(
    workletNativeRuntime: WorkletNativeRuntime,
    serializable: Serializable
  )
}
