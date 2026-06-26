package expo.modules.widgets

import androidx.compose.runtime.Composable
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.createComposeProps
import expo.modules.ui.CheckboxProps
import expo.modules.ui.CircularProgressIndicatorProps
import expo.modules.ui.LayoutProps
import expo.modules.ui.LinearProgressIndicatorProps
import expo.modules.ui.LoadingIndicatorProps
import expo.modules.ui.RadioButtonProps
import expo.modules.ui.SpacerProps
import expo.modules.ui.SwitchProps
import expo.modules.ui.TextProps
import expo.modules.widgets.ui.BoxView
import expo.modules.widgets.ui.ButtonView
import expo.modules.widgets.ui.CheckboxView
import expo.modules.widgets.ui.CircularProgressIndicatorView
import expo.modules.widgets.ui.ColumnView
import expo.modules.widgets.ui.ElevatedButtonView
import expo.modules.widgets.ui.FilledTonalButtonView
import expo.modules.widgets.ui.LinearProgressIndicatorView
import expo.modules.widgets.ui.LoadingIndicatorView
import expo.modules.widgets.ui.OutlinedButtonView
import expo.modules.widgets.ui.RadioButtonView
import expo.modules.widgets.ui.RowView
import expo.modules.widgets.ui.SpacerView
import expo.modules.widgets.ui.SwitchView
import expo.modules.widgets.ui.TextButtonView
import expo.modules.widgets.ui.TextView
import expo.modules.widgets.ui.WidgetButtonProps

@Composable
internal fun DynamicView(node: ReadableMap, source: String) {
  val type = if (node.hasKey("type")) node.getString("type") else null
  when (type) {
    "BoxView" -> BoxView(node.props<LayoutProps>()) {
      node.children().forEach { DynamicView(it, source) }
    }
    "CheckboxView" -> CheckboxView(node.props<CheckboxProps>())
    "CircularProgressIndicatorView" -> CircularProgressIndicatorView(node.props<CircularProgressIndicatorProps>())
    "ColumnView" -> ColumnView(node.props<LayoutProps>()) {
      node.children().forEach { DynamicView(it, source) }
    }
    "LinearProgressIndicatorView" -> LinearProgressIndicatorView(node.props<LinearProgressIndicatorProps>())
    "LoadingIndicatorView" -> LoadingIndicatorView(node.props<LoadingIndicatorProps>())
    "RadioButtonView" -> RadioButtonView(node.props<RadioButtonProps>())
    "react.fragment" -> node.children().forEach { DynamicView(it, source) }
    "RowView" -> RowView(node.props<LayoutProps>()) {
      node.children().forEach { DynamicView(it, source) }
    }
    "SpacerView" -> SpacerView(node.props<SpacerProps>())
    "SwitchView" -> SwitchView(node.props<SwitchProps>())
    "TextView" -> TextView(node.props<TextProps>())
    "Button" -> ButtonView(
      props = node.props<WidgetButtonProps>(),
      children = node.children(),
      source = source,
    )
    "FilledTonalButton" -> FilledTonalButtonView(
      props = node.props<WidgetButtonProps>(),
      children = node.children(),
      source = source,
    )
    "OutlinedButton" -> OutlinedButtonView(
      props = node.props<WidgetButtonProps>(),
      children = node.children(),
      source = source,
    )
    "ElevatedButton" -> ElevatedButtonView(
      props = node.props<WidgetButtonProps>(),
      children = node.children(),
      source = source,
    )
    "TextButton" -> TextButtonView(
      props = node.props<WidgetButtonProps>(),
      children = node.children(),
      source = source,
    )
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
      if (getType(index) == ReadableType.Map) {
        getMap(index)?.let(::add)
      }
    }
  }
}
