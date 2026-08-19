package expo.modules.kotlin.jni.worklets

import com.facebook.jni.HybridData
import expo.modules.kotlin.jni.WorkletsSoLoader

class WorkletNativeRuntime(
  jsRuntimePointer: Long
) {
  private val mHybridData = initHybrid(jsRuntimePointer)

  external fun initHybrid(jsRuntimePointer: Long): HybridData

  companion object {
    init {
      WorkletsSoLoader.loadIfPresent()
    }
  }
}
