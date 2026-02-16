package expo.modules.ui

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AlertDialogDefaults
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class AlertDialogButtonPressedEvent() : Record, Serializable

data class AlertDialogButtonColors(
  @Field val containerColor: android.graphics.Color? = null,
  @Field val contentColor: android.graphics.Color? = null
) : Record, Serializable

data class AlertDialogProps(
  val title: String? = null,
  val text: String? = null,
  val confirmButtonText: String? = null,
  val dismissButtonText: String? = null,
  val confirmButtonColors: AlertDialogButtonColors? = null,
  val dismissButtonColors: AlertDialogButtonColors? = null,
  val containerColor: android.graphics.Color? = null,
  val titleColor: android.graphics.Color? = null,
  val textColor: android.graphics.Color? = null,
  val visible: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.AlertDialogContent(
  props: AlertDialogProps,
  onDismissPressed: (AlertDialogButtonPressedEvent) -> Unit,
  onConfirmPressed: (AlertDialogButtonPressedEvent) -> Unit
) {
  if (!props.visible) {
    return
  }

  AlertDialog(
    confirmButton = {
      props.confirmButtonText?.let {
        TextButton(
          onClick = { onConfirmPressed(AlertDialogButtonPressedEvent()) },
          colors = ButtonDefaults.textButtonColors(
            containerColor = props.confirmButtonColors?.containerColor.composeOrNull ?: ButtonDefaults.textButtonColors().containerColor,
            contentColor = props.confirmButtonColors?.contentColor.composeOrNull ?: ButtonDefaults.textButtonColors().contentColor
          )
        ) {
          Text(it)
        }
      }
    },
    dismissButton = {
      props.dismissButtonText?.let {
        TextButton(
          onClick = { onDismissPressed(AlertDialogButtonPressedEvent()) },
          colors = ButtonDefaults.textButtonColors(
            containerColor = props.dismissButtonColors?.containerColor.composeOrNull ?: ButtonDefaults.textButtonColors().containerColor,
            contentColor = props.dismissButtonColors?.contentColor.composeOrNull ?: ButtonDefaults.textButtonColors().contentColor
          )
        ) {
          Text(it)
        }
      }
    },
    onDismissRequest = { onDismissPressed(AlertDialogButtonPressedEvent()) },
    containerColor = props.containerColor.composeOrNull ?: AlertDialogDefaults.containerColor,
    titleContentColor = props.titleColor.composeOrNull ?: AlertDialogDefaults.titleContentColor,
    textContentColor = props.textColor.composeOrNull ?: AlertDialogDefaults.textContentColor,
    title = { props.title?.let { Text(it) } },
    text = { props.text?.let { Text(it) } }
  )
}
