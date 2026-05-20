package expo.modules.kotlin.jni.worklets

import com.facebook.jni.HybridData

class WorkletNativeRuntime(
  jsRuntimePointer: Long
) {
  private val mHybridData = initHybrid(jsRuntimePointer)

  external fun initHybrid(jsRuntimePointer: Long): HybridData
}
