package expo.modules.widgets

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import expo.modules.widgets.jni.WidgetsHermesRuntime

internal object WidgetsJSRuntime {
  private var runtime: WidgetsHermesRuntime? = null

  @Synchronized
  fun render(context: Context, layout: String): ReadableMap {
    return getRuntime(context).render(layout, null, Arguments.makeNativeMap(emptyMap()))
  }

  private fun getRuntime(context: Context): WidgetsHermesRuntime {
    return runtime ?: WidgetsHermesRuntime().also {
      it.evaluateBundle(readBundle(context))
      runtime = it
    }
  }

  private fun readBundle(context: Context): String {
    return context.applicationContext.resources
      .openRawResource(R.raw.expo_widgets_bundle)
      .bufferedReader()
      .use { it.readText() }
  }
}
