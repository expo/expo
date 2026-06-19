package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.glance.Button
import androidx.glance.ButtonDefaults
import androidx.glance.GlanceTheme
import androidx.glance.action.Action
import androidx.glance.action.action
import androidx.glance.appwidget.components.FilledButton
import androidx.glance.appwidget.components.OutlineButton
import androidx.glance.unit.ColorProvider
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.ModifierList
import expo.modules.ui.button.ButtonColors
import expo.modules.ui.colorToComposeColorOrNull
import expo.modules.widgets.WidgetInteraction
import expo.modules.widgets.toGlanceAction
import androidx.glance.ButtonColors as GlanceButtonColors

@OptimizedComposeProps
data class WidgetButtonProps(
  val colors: ButtonColors = ButtonColors(),
  val enabled: Boolean = true,
  val modifiers: ModifierList = emptyList(),
  val target: String? = null
) : ComposeProps

@Composable
internal fun ButtonView(
  props: WidgetButtonProps,
  children: List<ReadableMap>,
  source: String,
) {
  WidgetFilledButton(
    props = props,
    children = children,
    onClick = buttonAction(source, props.target),
    defaultBackgroundColor = GlanceTheme.colors.primary,
    defaultContentColor = GlanceTheme.colors.onPrimary
  )
}

@Composable
internal fun FilledTonalButtonView(
  props: WidgetButtonProps,
  children: List<ReadableMap>,
  source: String,
) {
  WidgetFilledButton(
    props = props,
    children = children,
    onClick = buttonAction(source, props.target),
    defaultBackgroundColor = GlanceTheme.colors.secondaryContainer,
    defaultContentColor = GlanceTheme.colors.onSecondaryContainer
  )
}

@Composable
internal fun OutlinedButtonView(
  props: WidgetButtonProps,
  children: List<ReadableMap>,
  source: String,
) {
  val buttonText = props.textContent(children)
  val contentColor = props.toGlanceContentColor(GlanceTheme.colors.primary)
  val modifier = props.modifiers.toGlanceModifier()

  OutlineButton(
    text = buttonText,
    contentColor = contentColor,
    onClick = buttonAction(source, props.target),
    modifier = modifier,
    enabled = props.enabled
  )
}

@Composable
internal fun ElevatedButtonView(
  props: WidgetButtonProps,
  children: List<ReadableMap>,
  source: String,
) {
  WidgetFilledButton(
    props = props,
    children = children,
    onClick = buttonAction(source, props.target),
    defaultBackgroundColor = GlanceTheme.colors.surface,
    defaultContentColor = GlanceTheme.colors.primary
  )
}

@Composable
internal fun TextButtonView(
  props: WidgetButtonProps,
  children: List<ReadableMap>,
  source: String,
) {
  val buttonText = props.textContent(children)
  val modifier = props.modifiers.toGlanceModifier()
  val colors = props.toGlanceButtonColors(
    defaultBackgroundColor = Color.Transparent.toGlanceColorProvider(),
    defaultContentColor = GlanceTheme.colors.primary
  )

  Button(
    text = buttonText,
    onClick = buttonAction(source, props.target),
    modifier = modifier,
    enabled = props.enabled,
    colors = colors
  )
}

@Composable
private fun WidgetFilledButton(
  props: WidgetButtonProps,
  children: List<ReadableMap>,
  onClick: Action,
  defaultBackgroundColor: ColorProvider,
  defaultContentColor: ColorProvider
) {
  FilledButton(
    text = props.textContent(children),
    onClick = onClick,
    modifier = props.modifiers.toGlanceModifier(),
    enabled = props.enabled,
    colors = props.toGlanceButtonColors(defaultBackgroundColor, defaultContentColor)
  )
}

// TODO(@jakex7): Find a better way to get text
private fun WidgetButtonProps.textContent(children: List<ReadableMap>): String {
  return children.textContent() ?: ""
}

private fun List<ReadableMap>.textContent(): String? {
  return mapNotNull { it.textFromTextNode() }.joinToString(separator = "")
    .takeIf { it.isNotEmpty() }
}

@Composable
private fun WidgetButtonProps.toGlanceButtonColors(
  defaultBackgroundColor: ColorProvider,
  defaultContentColor: ColorProvider
): GlanceButtonColors {
  return ButtonDefaults.buttonColors(
    backgroundColor = toGlanceContainerColor(defaultBackgroundColor),
    contentColor = toGlanceContentColor(defaultContentColor)
  )
}

private fun WidgetButtonProps.toGlanceContainerColor(defaultColor: ColorProvider): ColorProvider {
  return colorToComposeColorOrNull(
    if (enabled) {
      colors.containerColor
    } else {
      colors.disabledContainerColor ?: colors.containerColor
    }
  )?.toGlanceColorProvider() ?: defaultColor
}

private fun WidgetButtonProps.toGlanceContentColor(defaultColor: ColorProvider): ColorProvider {
  return colorToComposeColorOrNull(
    if (enabled) {
      colors.contentColor
    } else {
      colors.disabledContentColor ?: colors.contentColor
    }
  )?.toGlanceColorProvider() ?: defaultColor
}

@Composable
private fun buttonAction(source: String, target: String?): Action {
  return target?.let { WidgetInteraction(source, it).toGlanceAction() } ?: action {}
}

private fun ReadableMap.textFromTextNode(): String? {
  val type = if (hasKey("type")) getString("type") else null
  return when (type) {
    "TextView" -> propsMap()?.textContent()
    "react.fragment" -> children().textContent()
    else -> null
  }
}

private fun ReadableMap.textContent(): String? {
  return spansText()
    ?: stringValue("text")?.takeIf { it.isNotEmpty() }
}

private fun ReadableMap.spansText(): String? {
  if (!hasKey("spans") || getType("spans") != ReadableType.Array) {
    return null
  }

  return getArray("spans")
    ?.spansText()
    ?.takeIf { it.isNotEmpty() }
}

private fun ReadableArray.spansText(): String {
  return buildString {
    for (index in 0 until size()) {
      if (getType(index) == ReadableType.Map) {
        getMap(index)?.let { span ->
          append(span.spansText() ?: span.stringValue("text").orEmpty())
        }
      }
    }
  }
}

private fun ReadableMap.stringValue(key: String): String? {
  if (!hasKey(key) || isNull(key)) {
    return null
  }

  return when (getType(key)) {
    ReadableType.Boolean -> getBoolean(key).toString()
    ReadableType.Number -> getDouble(key).toString()
    ReadableType.String -> getString(key)
    else -> null
  }
}

private fun ReadableMap.children(): List<ReadableMap> {
  val props = propsMap() ?: return emptyList()
  if (!props.hasKey("children")) {
    return emptyList()
  }

  return when (props.getType("children")) {
    ReadableType.Map -> listOfNotNull(props.getMap("children"))
    ReadableType.Array -> props.getArray("children")?.children() ?: emptyList()
    else -> emptyList()
  }
}

private fun ReadableArray.children(): List<ReadableMap> {
  return buildList {
    for (index in 0 until size()) {
      if (getType(index) == ReadableType.Map) {
        getMap(index)?.let(::add)
      }
    }
  }
}

private fun ReadableMap.propsMap(): ReadableMap? {
  return if (hasKey("props") && !isNull("props")) {
    getMap("props")
  } else {
    null
  }
}
