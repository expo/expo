package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.glance.Button
import androidx.glance.ButtonDefaults
import androidx.glance.GlanceTheme
import androidx.glance.unit.ColorProvider
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import expo.modules.ui.button.ButtonProps
import expo.modules.ui.colorToComposeColorOrNull
import androidx.glance.ButtonColors
import androidx.glance.appwidget.components.FilledButton
import androidx.glance.appwidget.components.OutlineButton

@Composable
internal fun ButtonView(
  props: ButtonProps,
  children: List<ReadableMap> = emptyList()
) {
  FilledButton(
    text = props.textContent(children),
    onClick = {},
    modifier = props.modifiers.toGlanceModifier(),
    enabled = props.enabled,
    colors = props.toGlanceButtonColors(
      defaultBackgroundColor = GlanceTheme.colors.primary,
      defaultContentColor = GlanceTheme.colors.onPrimary
    )
  )
}

@Composable
internal fun FilledTonalButtonView(
  props: ButtonProps,
  children: List<ReadableMap> = emptyList()
) {
  FilledButton(
    text = props.textContent(children),
    onClick = {},
    modifier = props.modifiers.toGlanceModifier(),
    enabled = props.enabled,
    colors = props.toGlanceButtonColors(
      defaultBackgroundColor = GlanceTheme.colors.secondaryContainer,
      defaultContentColor = GlanceTheme.colors.onSecondaryContainer
    )
  )
}

@Composable
internal fun OutlinedButtonView(
  props: ButtonProps,
  children: List<ReadableMap> = emptyList()
) {
  OutlineButton(
    text = props.textContent(children),
    contentColor = props.toGlanceContentColor(GlanceTheme.colors.primary),
    onClick = {},
    modifier = props.modifiers.toGlanceModifier(),
    enabled = props.enabled
  )
}

@Composable
internal fun ElevatedButtonView(
  props: ButtonProps,
  children: List<ReadableMap> = emptyList()
) {
  FilledButton(
    text = props.textContent(children),
    onClick = {},
    modifier = props.modifiers.toGlanceModifier(),
    enabled = props.enabled,
    colors = props.toGlanceButtonColors(
      defaultBackgroundColor = GlanceTheme.colors.surface,
      defaultContentColor = GlanceTheme.colors.primary
    )
  )
}

@Composable
internal fun TextButtonView(
  props: ButtonProps,
  children: List<ReadableMap> = emptyList()
) {
  Button(
    text = props.textContent(children),
    onClick = {},
    modifier = props.modifiers.toGlanceModifier(),
    enabled = props.enabled,
    colors = props.toGlanceButtonColors(
      defaultBackgroundColor = Color.Transparent.toGlanceColorProvider(),
      defaultContentColor = GlanceTheme.colors.primary
    )
  )
}

// TODO(@jakex7): Find a better way to get text
private fun ButtonProps.textContent(children: List<ReadableMap>): String {
  return children.textContent() ?: ""
}

private fun List<ReadableMap>.textContent(): String? {
  return mapNotNull { it.textFromTextNode() }
    .joinToString(separator = "")
    .takeIf { it.isNotEmpty() }
}

@Composable
private fun ButtonProps.toGlanceButtonColors(
  defaultBackgroundColor: ColorProvider,
  defaultContentColor: ColorProvider
): ButtonColors {
  return ButtonDefaults.buttonColors(
    backgroundColor = toGlanceContainerColor(defaultBackgroundColor),
    contentColor = toGlanceContentColor(defaultContentColor)
  )
}

private fun ButtonProps.toGlanceContainerColor(defaultColor: ColorProvider): ColorProvider {
  return colorToComposeColorOrNull(
    if (enabled) {
      colors.containerColor
    } else {
      colors.disabledContainerColor ?: colors.containerColor
    }
  )?.toGlanceColorProvider() ?: defaultColor
}

private fun ButtonProps.toGlanceContentColor(defaultColor: ColorProvider): ColorProvider {
  return colorToComposeColorOrNull(
    if (enabled) {
      colors.contentColor
    } else {
      colors.disabledContentColor ?: colors.contentColor
    }
  )?.toGlanceColorProvider() ?: defaultColor
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
