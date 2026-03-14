package expo.modules.ui

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeEventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class AlertDialogButtonPressedEvent() : Record, Serializable

data class AlertDialogProps(
  val title: String? = null,
  val text: String? = null,
  val confirmButtonText: String? = null,
  val dismissButtonText: String? = null,
  val visible: Boolean = false,
  val modifiers: ModifierList = emptyList(),
  val onDismissPressed: ComposeEventDispatcher<AlertDialogButtonPressedEvent> = ComposeEventDispatcher(),
  val onConfirmPressed: ComposeEventDispatcher<AlertDialogButtonPressedEvent> = ComposeEventDispatcher()
) : ComposeProps

@Composable
fun FunctionalComposableScope.AlertDialogContent(
  props: AlertDialogProps
) {
  if (!props.visible) {
    return
  }

  AlertDialog(
    confirmButton = {
      props.confirmButtonText?.let {
        TextButton(onClick = { props.onConfirmPressed(AlertDialogButtonPressedEvent()) }) {
          Text(it)
        }
      }
    },
    dismissButton = {
      props.dismissButtonText?.let {
        TextButton(onClick = { props.onDismissPressed(AlertDialogButtonPressedEvent()) }) {
          Text(it)
        }
      }
    },
    onDismissRequest = { props.onDismissPressed(AlertDialogButtonPressedEvent()) },
    title = { props.title?.let { Text(it) } },
    text = { props.text?.let { Text(it) } }
  )
}
