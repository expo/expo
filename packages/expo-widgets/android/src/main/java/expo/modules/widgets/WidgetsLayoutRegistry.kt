package expo.modules.widgets

import android.content.Context
import org.json.JSONObject

private const val WIDGETS_KEY_PREFIX = "__expo_widgets_"

private data class EmbeddedWidget(
  val layout: String,
  val initialProps: Map<String, Any?>?
)

internal object WidgetsLayoutRegistry {
  private var embeddedWidgets: Map<String, EmbeddedWidget>? = null

  fun layout(context: Context, name: String): String? {
    return WidgetsStorage.getString(context, storageKey(name, "layout"))?.takeIf { it.isNotEmpty() }
      ?: embeddedWidget(context, name)?.layout
  }

  fun props(context: Context, name: String): Map<String, Any?>? {
    return WidgetsStorage.getDictionary(context, storageKey(name, "props"))
      ?: initialProps(context, name)
  }

  private fun initialProps(context: Context, name: String): Map<String, Any?>? {
    return WidgetsStorage.getDictionary(context, storageKey(name, "initial_props"))
      ?: embeddedWidget(context, name)?.initialProps
  }

  private fun embeddedWidget(context: Context, name: String): EmbeddedWidget? {
    return embeddedWidgets(context)[name]
  }

  private fun embeddedWidgets(context: Context): Map<String, EmbeddedWidget> {
    return embeddedWidgets ?: readEmbeddedWidgets(context.applicationContext).also {
      embeddedWidgets = it
    }
  }

  private fun readEmbeddedWidgets(context: Context): Map<String, EmbeddedWidget> {
    return runCatching {
      val registry = context.resources
        .openRawResource(R.raw.expo_widgets_layout_registry)
        .bufferedReader()
        .use { it.readText() }

      val widgets = JSONObject(registry).optJSONObject("widgets") ?: return@runCatching emptyMap()
      widgets.keys().asSequence().mapNotNull { name ->
        val widget = widgets.optJSONObject(name) ?: return@mapNotNull null
        val layout = widget.optString("layout").takeIf(String::isNotEmpty) ?: return@mapNotNull null
        val initialProps = widget.optJSONObject("initialProps")?.let { props ->
          WidgetsJson.parseMap(props.toString())
        }
        name to EmbeddedWidget(layout, initialProps)
      }.toMap()
    }.getOrDefault(emptyMap())
  }

  private fun storageKey(name: String, suffix: String): String {
    return "$WIDGETS_KEY_PREFIX${name}_$suffix"
  }
}
