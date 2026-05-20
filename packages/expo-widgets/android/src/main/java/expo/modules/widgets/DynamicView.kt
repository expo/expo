package expo.modules.widgets

import androidx.compose.runtime.Composable
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.createComposeProps
import expo.modules.widgets.ui.ButtonProps
import expo.modules.widgets.ui.ButtonView
import expo.modules.widgets.ui.BoxProps
import expo.modules.widgets.ui.BoxView
import expo.modules.widgets.ui.CheckboxProps
import expo.modules.widgets.ui.CheckboxView
import expo.modules.widgets.ui.CircularProgressIndicatorProps
import expo.modules.widgets.ui.CircularProgressIndicatorView
import expo.modules.widgets.ui.ColumnProps
import expo.modules.widgets.ui.ColumnView
import expo.modules.widgets.ui.LinearProgressIndicatorProps
import expo.modules.widgets.ui.LinearProgressIndicatorView
import expo.modules.widgets.ui.LoadingIndicatorProps
import expo.modules.widgets.ui.LoadingIndicatorView
import expo.modules.widgets.ui.RadioButtonProps
import expo.modules.widgets.ui.RadioButtonView
import expo.modules.widgets.ui.RowProps
import expo.modules.widgets.ui.RowView
import expo.modules.widgets.ui.SpacerProps
import expo.modules.widgets.ui.SpacerView
import expo.modules.widgets.ui.SwitchProps
import expo.modules.widgets.ui.SwitchView
import expo.modules.widgets.ui.TextProps
import expo.modules.widgets.ui.TextView

@Composable
internal fun DynamicView(node: ReadableMap) {
  when (if (node.hasKey("type")) node.getString("type") else null) {
    "Button",
    "FilledTonalButton",
    "OutlinedButton",
    "ElevatedButton",
    "TextButton" -> ButtonView(node.props<ButtonProps>(), node.nodeText())
    "BoxView" -> BoxView(node.props<BoxProps>()) {
      node.children().forEach { DynamicView(it) }
    }
    "CheckboxView" -> CheckboxView(node.props<CheckboxProps>())
    "CircularProgressIndicatorView" -> CircularProgressIndicatorView(node.props<CircularProgressIndicatorProps>())
    "ColumnView" -> ColumnView(node.props<ColumnProps>()) {
      node.children().forEach { DynamicView(it) }
    }
    "LinearProgressIndicatorView" -> LinearProgressIndicatorView(node.props<LinearProgressIndicatorProps>())
    "LoadingIndicatorView" -> LoadingIndicatorView(node.props<LoadingIndicatorProps>())
    "RadioButtonView" -> RadioButtonView(node.props<RadioButtonProps>())
    "react.fragment" -> node.children().forEach { DynamicView(it) }
    "RowView" -> RowView(node.props<RowProps>()) {
      node.children().forEach { DynamicView(it) }
    }
    "SpacerView" -> SpacerView(node.props<SpacerProps>())
    "SwitchView" -> SwitchView(node.props<SwitchProps>())
    "TextView" -> TextView(node.props<TextProps>())
    else -> TextView(TextProps("View not found"))
  }
}

private inline fun <reified Props : ComposeProps> ReadableMap.props(): Props {
  return createComposeProps(
    propsMap()
  )
}

private fun ReadableMap.propsMap(): ReadableMap? {
  return if (hasKey("props") && !isNull("props")) {
    getMap("props")
  } else {
    null
  }
}

private fun ReadableMap.children(): List<ReadableMap> {
  val props = propsMap() ?: return emptyList()
  if (!props.hasKey("children") || props.isNull("children")) {
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
      if (!isNull(index) && getType(index) == ReadableType.Map) {
        getMap(index)?.let(::add)
      }
    }
  }
}

private fun ReadableMap.nodeText(): String {
  val props = propsMap() ?: return ""
  return props.textValue("label")
    ?: props.textValue("text")
    ?: props.textValue("children")
    ?: ""
}

private fun ReadableMap.textValue(name: String): String? {
  if (!hasKey(name) || isNull(name)) {
    return null
  }

  return when (getType(name)) {
    ReadableType.String -> getString(name)
    ReadableType.Number -> getDouble(name).toString()
    ReadableType.Boolean -> getBoolean(name).toString()
    ReadableType.Map -> getMap(name)?.nodeText()
    ReadableType.Array -> getArray(name)?.textValue()
    else -> null
  }
}

private fun ReadableArray.textValue(): String {
  return buildString {
    for (index in 0 until size()) {
      if (isNull(index)) {
        continue
      }

      val value = when (getType(index)) {
        ReadableType.String -> getString(index)
        ReadableType.Number -> getDouble(index).toString()
        ReadableType.Boolean -> getBoolean(index).toString()
        ReadableType.Map -> getMap(index)?.nodeText()
        ReadableType.Array -> getArray(index)?.textValue()
        else -> null
      }

      if (value != null) {
        append(value)
      }
    }
  }
}
