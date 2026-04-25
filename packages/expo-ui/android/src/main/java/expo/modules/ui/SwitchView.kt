package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
open class CheckedChangeEvent(
  @Field open val value: Boolean = false
) : Record, Serializable

@OptimizedRecord
data class SwitchColors(
  @Field val checkedThumbColor: Color? = null,
  @Field val checkedTrackColor: Color? = null,
  @Field val checkedBorderColor: Color? = null,
  @Field val checkedIconColor: Color? = null,
  @Field val uncheckedThumbColor: Color? = null,
  @Field val uncheckedTrackColor: Color? = null,
  @Field val uncheckedBorderColor: Color? = null,
  @Field val uncheckedIconColor: Color? = null,
  @Field val disabledCheckedThumbColor: Color? = null,
  @Field val disabledCheckedTrackColor: Color? = null,
  @Field val disabledCheckedBorderColor: Color? = null,
  @Field val disabledCheckedIconColor: Color? = null,
  @Field val disabledUncheckedThumbColor: Color? = null,
  @Field val disabledUncheckedTrackColor: Color? = null,
  @Field val disabledUncheckedBorderColor: Color? = null,
  @Field val disabledUncheckedIconColor: Color? = null
) : Record

@OptimizedComposeProps
data class SwitchProps(
  val value: Boolean = false,
  val enabled: Boolean = true,
  val colors: SwitchColors = SwitchColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SwitchContent(
  props: SwitchProps,
  onCheckedChange: (Boolean) -> Unit
) {
  val thumbContentSlotView = findChildSlotView(view, "thumbContent")

  Switch(
    checked = props.value,
    onCheckedChange = onCheckedChange,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    enabled = props.enabled,
    thumbContent = thumbContentSlotView?.let {
      {
        with(UIComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    },
    colors = SwitchDefaults.colors(
      checkedThumbColor = props.colors.checkedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().checkedThumbColor,
      checkedTrackColor = props.colors.checkedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().checkedTrackColor,
      checkedBorderColor = props.colors.checkedBorderColor.composeOrNull
        ?: SwitchDefaults.colors().checkedBorderColor,
      checkedIconColor = props.colors.checkedIconColor.composeOrNull
        ?: SwitchDefaults.colors().checkedIconColor,
      uncheckedThumbColor = props.colors.uncheckedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedThumbColor,
      uncheckedTrackColor = props.colors.uncheckedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedTrackColor,
      uncheckedBorderColor = props.colors.uncheckedBorderColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedBorderColor,
      uncheckedIconColor = props.colors.uncheckedIconColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedIconColor,
      disabledCheckedBorderColor = props.colors.disabledCheckedBorderColor.composeOrNull
        ?: SwitchDefaults.colors().disabledCheckedBorderColor,
      disabledCheckedThumbColor = props.colors.disabledCheckedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().disabledCheckedThumbColor,
      disabledCheckedTrackColor = props.colors.disabledCheckedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().disabledCheckedTrackColor,
      disabledCheckedIconColor = props.colors.disabledCheckedIconColor.composeOrNull
        ?: SwitchDefaults.colors().disabledCheckedIconColor,
      disabledUncheckedBorderColor = props.colors.disabledUncheckedBorderColor.composeOrNull
        ?: SwitchDefaults.colors().disabledUncheckedBorderColor,
      disabledUncheckedThumbColor = props.colors.disabledUncheckedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().disabledUncheckedThumbColor,
      disabledUncheckedTrackColor = props.colors.disabledUncheckedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().disabledUncheckedTrackColor,
      disabledUncheckedIconColor = props.colors.disabledUncheckedIconColor.composeOrNull
        ?: SwitchDefaults.colors().disabledUncheckedIconColor
    )
  )
}
