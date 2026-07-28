package expo.modules.widgets

import android.content.Context
import android.content.res.Configuration
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap

internal fun getWidgetEnvironment(context: Context): Map<String, Any?> {
  return mapOf(
    "colorScheme" to context.colorScheme(),
    "configuration" to emptyMap<String, Any?>()
  )
}

internal fun evaluateLayout(
  context: Context,
  layout: String,
  props: Map<String, Any?>?,
  environment: Map<String, Any?>
): ReadableMap {
  return runCatching {
    WidgetsJSRuntime.render(context, layout, props, environment)
  }.getOrElse { error ->
    createErrorNode(error.message ?: "Expo widget layout evaluation failed.")
  }
}

internal fun evaluateWidgetButtonPress(
  context: Context,
  layout: String,
  props: Map<String, Any?>?,
  environment: Map<String, Any?>
): Map<String, Any?>? {
  return runCatching {
    WidgetsJSRuntime.handlePress(context, layout, props, environment)
  }.getOrNull()
}

internal fun createErrorNode(message: String): ReadableMap {
  return Arguments.makeNativeMap(
    mapOf(
      "type" to "TextView",
      "props" to mapOf("text" to message)
    )
  )
}

private fun Context.colorScheme(): String {
  val nightMode = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
  return if (nightMode == Configuration.UI_MODE_NIGHT_YES) {
    "dark"
  } else {
    "light"
  }
}
