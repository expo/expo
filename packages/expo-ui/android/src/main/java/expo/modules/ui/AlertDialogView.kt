package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AlertDialogDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.DialogProperties
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class AlertDialogColors(
  @Field val containerColor: Color? = null,
  @Field val iconContentColor: Color? = null,
  @Field val titleContentColor: Color? = null,
  @Field val textContentColor: Color? = null
) : Record

data class ExpoDialogProperties(
  @Field val dismissOnBackPress: Boolean = true,
  @Field val dismissOnClickOutside: Boolean = true,
  @Field val usePlatformDefaultWidth: Boolean = true,
  @Field val decorFitsSystemWindows: Boolean = true
) : Record

data class AlertDialogProps(
  val colors: AlertDialogColors = AlertDialogColors(),
  val tonalElevation: Double? = null,
  val properties: ExpoDialogProperties = ExpoDialogProperties(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.AlertDialogContent(
  props: AlertDialogProps,
  onDismissRequest: () -> Unit
) {
  val titleSlotView = findChildSlotView(view, "title")
  val textSlotView = findChildSlotView(view, "text")
  val confirmButtonSlotView = findChildSlotView(view, "confirmButton")
  val dismissButtonSlotView = findChildSlotView(view, "dismissButton")
  val iconSlotView = findChildSlotView(view, "icon")

  AlertDialog(
    onDismissRequest = { onDismissRequest() },
    confirmButton = {
      confirmButtonSlotView?.let {
        with(ComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    dismissButton = dismissButtonSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    title = titleSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    text = textSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    icon = iconSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    containerColor = props.colors.containerColor.composeOrNull
      ?: AlertDialogDefaults.containerColor,
    iconContentColor = props.colors.iconContentColor.composeOrNull
      ?: AlertDialogDefaults.iconContentColor,
    titleContentColor = props.colors.titleContentColor.composeOrNull
      ?: AlertDialogDefaults.titleContentColor,
    textContentColor = props.colors.textContentColor.composeOrNull
      ?: AlertDialogDefaults.textContentColor,
    tonalElevation = props.tonalElevation?.dp ?: AlertDialogDefaults.TonalElevation,
    properties = DialogProperties(
      dismissOnBackPress = props.properties.dismissOnBackPress,
      dismissOnClickOutside = props.properties.dismissOnClickOutside,
      usePlatformDefaultWidth = props.properties.usePlatformDefaultWidth,
      decorFitsSystemWindows = props.properties.decorFitsSystemWindows
    )
  )
}
