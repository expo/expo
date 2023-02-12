package abi47_0_0.host.exp.exponent.modules.api.safeareacontext

import android.view.View
import android.view.ViewGroup
import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi47_0_0.com.facebook.react.common.MapBuilder
import abi47_0_0.com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SafeAreaContextModule.NAME)
class SafeAreaContextModule(reactContext: ReactApplicationContext?) :
  NativeSafeAreaContextSpec(reactContext) {
  override fun getName(): String {
    return NAME
  }

  public override fun getTypedExportedConstants(): Map<String, Any> {
    return MapBuilder.of<String, Any>("initialWindowMetrics", getInitialWindowMetrics())
  }

  private fun getInitialWindowMetrics(): Map<String, Any>? {
    val decorView = reactApplicationContext.currentActivity?.window?.decorView as ViewGroup?
    val contentView = decorView?.findViewById<View>(android.R.id.content) ?: return null
    val insets = getSafeAreaInsets(decorView)
    val frame = getFrame(decorView, contentView)
    return if (insets == null || frame == null) {
      null
    } else mapOf("insets" to edgeInsetsToJavaMap(insets), "frame" to rectToJavaMap(frame))
  }

  companion object {
    const val NAME = "RNCSafeAreaContext"
  }
}
