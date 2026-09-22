package expo.modules.kotlin.jni.worklets

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

class WorkletNativeRuntime(
  jsRuntimePointer: Long
) {
  @DoNotStrip
  private val mHybridData = initHybrid(jsRuntimePointer)

  external fun initHybrid(jsRuntimePointer: Long): HybridData
}
