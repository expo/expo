package expo.modules.widgets

import android.content.Context
import expo.modules.widgets.jni.WidgetsHermesRuntime
import org.json.JSONObject

internal object WidgetsJSRuntime {
  private var runtime: WidgetsHermesRuntime? = null
  private var isBundleLoaded = false

  @Synchronized
  fun render(context: Context, layout: String, ): JSONObject {
    val result = getRuntime(context).render(layout, "{}", "{}")
    return JSONObject(result)
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
