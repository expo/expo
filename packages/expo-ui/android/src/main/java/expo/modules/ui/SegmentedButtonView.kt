package expo.modules.ui

import android.graphics.Color
import android.util.Log
import android.view.ViewGroup
import androidx.compose.material3.MultiChoiceSegmentedButtonRowScope
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRowScope
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class SegmentedButtonColors(
  @Field val activeBorderColor: Color? = null,
  @Field val activeContentColor: Color? = null,
  @Field val inactiveBorderColor: Color? = null,
  @Field val inactiveContentColor: Color? = null,
  @Field val disabledActiveBorderColor: Color? = null,
  @Field val disabledActiveContentColor: Color? = null,
  @Field val disabledInactiveBorderColor: Color? = null,
  @Field val disabledInactiveContentColor: Color? = null,
  @Field val activeContainerColor: Color? = null,
  @Field val inactiveContainerColor: Color? = null,
  @Field val disabledActiveContainerColor: Color? = null,
  @Field val disabledInactiveContainerColor: Color? = null
) : Record

@OptimizedComposeProps
data class SegmentedButtonProps(
  val selected: Boolean = false,
  val checked: Boolean = false,
  val enabled: Boolean = true,
  val colors: SegmentedButtonColors = SegmentedButtonColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SegmentedButtonContent(
  props: SegmentedButtonProps,
  onClick: () -> Unit,
  onCheckedChange: (GenericEventPayload1<Boolean>) -> Unit
) {
  val colors = props.colors
  val labelSlotView = findChildSlotView(view, "label")
  val parent = view.parent as? ViewGroup
  val index = parent?.indexOfChild(view) ?: 0
  val count = parent?.childCount ?: 1

  val segmentedColors = SegmentedButtonDefaults.colors(
    activeBorderColor = colors.activeBorderColor.compose,
    activeContentColor = colors.activeContentColor.compose,
    inactiveBorderColor = colors.inactiveBorderColor.compose,
    inactiveContentColor = colors.inactiveContentColor.compose,
    disabledActiveBorderColor = colors.disabledActiveBorderColor.compose,
    disabledActiveContentColor = colors.disabledActiveContentColor.compose,
    disabledInactiveBorderColor = colors.disabledInactiveBorderColor.compose,
    disabledInactiveContentColor = colors.disabledInactiveContentColor.compose,
    activeContainerColor = colors.activeContainerColor.compose,
    inactiveContainerColor = colors.inactiveContainerColor.compose,
    disabledActiveContainerColor = colors.disabledActiveContainerColor.compose,
    disabledInactiveContainerColor = colors.disabledInactiveContainerColor.compose
  )

  val shape = SegmentedButtonDefaults.itemShape(index = index, count = count)
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val label: @Composable () -> Unit = labelSlotView?.let {
    {
      with(UIComposableScope()) {
        with(it) {
          Content()
        }
      }
    }
  } ?: {}

  val singleScope = composableScope.rowScope as? SingleChoiceSegmentedButtonRowScope
  val multiScope = composableScope.rowScope as? MultiChoiceSegmentedButtonRowScope

  if (singleScope == null && multiScope == null) {
    if (BuildConfig.DEBUG) {
      Log.w("ExpoUI", "SegmentedButton must be used within a SingleChoiceSegmentedButtonRow or MultiChoiceSegmentedButtonRow. It will not render on its own.")
    }
    return
  }

  if (singleScope != null) {
    with(singleScope) {
      SegmentedButton(
        selected = props.selected,
        onClick = onClick,
        shape = shape,
        enabled = props.enabled,
        colors = segmentedColors,
        modifier = modifier,
        label = label
      )
    }
  } else if (multiScope != null) {
    with(multiScope) {
      SegmentedButton(
        checked = props.checked,
        onCheckedChange = { onCheckedChange(GenericEventPayload1(it)) },
        shape = shape,
        enabled = props.enabled,
        colors = segmentedColors,
        modifier = modifier,
        label = label
      )
    }
  }
}
