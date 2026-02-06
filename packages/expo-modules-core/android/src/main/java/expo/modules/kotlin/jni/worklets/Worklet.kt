package expo.modules.kotlin.jni.worklets

import expo.modules.kotlin.runtime.WorkletRuntime
import expo.modules.kotlin.types.JSTypeConverterProvider

class Worklet internal constructor(
  private val serializable: Serializable
) {
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

  fun schedule(runtime: WorkletRuntime, vararg arguments: Any?) {
    val runtimeHolder = runtime.enforceHolder

    val convertedArgs = arguments.map {
      JSTypeConverterProvider.convertToJSValue(it, useExperimentalConverter = true)
    }.toTypedArray()

    schedule(runtimeHolder, serializable, convertedArgs)
  }

  fun execute(runtime: WorkletRuntime, vararg arguments: Any?) {
    val runtimeHolder = runtime.enforceHolder

    val convertedArgs = arguments.map {
      JSTypeConverterProvider.convertToJSValue(it, useExperimentalConverter = true)
    }.toTypedArray()

    execute(runtimeHolder, serializable, convertedArgs)
  }

  private external fun schedule(
    workletNativeRuntime: WorkletNativeRuntime,
    serializable: Serializable
  )

  private external fun schedule(
    workletNativeRuntime: WorkletNativeRuntime,
    serializable: Serializable,
    args: Array<Any?>
  )

  private external fun execute(
    workletNativeRuntime: WorkletNativeRuntime,
    serializable: Serializable
  )

  private external fun execute(
    workletNativeRuntime: WorkletNativeRuntime,
    serializable: Serializable,
    args: Array<Any?>
  )
}
