package expo.modules.widgets.jni

import java.io.Closeable

internal class WidgetsHermesRuntime : Closeable {
  private var nativeHandle = nativeCreate()

  fun evaluateBundle(script: String) {
    nativeEvaluateVoid(nativeHandle, script, "ExpoWidgets.bundle")
  }

  fun render(layout: String, propsJson: String, environmentJson: String): String {
    return nativeRender(nativeHandle, layout, propsJson, environmentJson)
  }

  override fun close() {
    if (nativeHandle != 0L) {
      nativeRelease(nativeHandle)
      nativeHandle = 0L
    }
  }

  private external fun nativeCreate(): Long
  private external fun nativeRelease(handle: Long)
  private external fun nativeEvaluateVoid(handle: Long, script: String, sourceUrl: String)
  private external fun nativeRender(handle: Long, layout: String, propsJson: String, environmentJson: String): String

  companion object {
    init {
      System.loadLibrary("expo-widgets")
    }
  }
}
