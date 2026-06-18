package expo.modules.widgets.jni

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.ReadableNativeMap
import java.io.Closeable

@DoNotStripAny
internal class WidgetsHermesRuntime : Closeable {
  @Suppress("NoHungarianNotation")
  private val mHybridData: HybridData = initHybrid()

  fun evaluateBundle(script: String) {
    nativeEvaluateBundle(script, "ExpoWidgets.bundle")
  }

  fun render(layout: String, props: ReadableNativeMap?, environment: ReadableNativeMap): ReadableNativeMap {
    return nativeRender(layout, props, environment)
  }

  override fun close() {
    mHybridData.resetNative()
  }

  private external fun nativeEvaluateBundle(script: String, sourceUrl: String)
  private external fun nativeRender(layout: String, props: ReadableNativeMap?, environment: ReadableNativeMap): ReadableNativeMap

  companion object {
    init {
      System.loadLibrary("expo-widgets")
    }

    @JvmStatic
    private external fun initHybrid(): HybridData
  }
}
