package expo.modules.widgets

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import expo.modules.widgets.jni.WidgetsHermesRuntime

internal object WidgetsJSRuntime {
  private var runtime: WidgetsHermesRuntime? = null
  private var isBundleLoaded = false

  @Synchronized
  fun render(context: Context, layout: String): ReadableMap {
    return getRuntime(context).render(layout, "{}", "{}")
  }

  private fun getRuntime(context: Context): WidgetsHermesRuntime {
    val existingRuntime = runtime ?: WidgetsHermesRuntime().also {
      runtime = it
      isBundleLoaded = false
    }

    if (!isBundleLoaded) {
      existingRuntime.evaluateBundle(readBundle(context))
      isBundleLoaded = true
    }

    return existingRuntime
  }

  private fun readBundle(context: Context): String {
    return context.applicationContext.assets.open("ExpoWidgets.bundle").bufferedReader().use {
      it.readText()
    }
  }
}
