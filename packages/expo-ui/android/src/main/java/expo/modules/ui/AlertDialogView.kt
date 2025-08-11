package expo.modules.ui

import android.content.Context
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import androidx.compose.ui.Modifier
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.records.Record
import java.io.Serializable

open class AlertDialogButtonPressedEvent() : Record, Serializable

data class AlertDialogProps(
  val title: MutableState<String?> = mutableStateOf(null),
  val text: MutableState<String?> = mutableStateOf(null),
  val confirmButtonText: MutableState<String?> = mutableStateOf(null),
  val dismissButtonText: MutableState<String?> = mutableStateOf(null),
  val visible: MutableState<Boolean> = mutableStateOf(false),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class AlertDialogView(context: Context, appContext: AppContext) :
  ExpoComposeView<AlertDialogProps>(context, appContext, withHostingView = true) {
  override val props = AlertDialogProps()
  private val onDismissPressed by EventDispatcher<AlertDialogButtonPressedEvent>()
  private val onConfirmPressed by EventDispatcher<AlertDialogButtonPressedEvent>()

  @Composable
  override fun Content(modifier: Modifier) {
    val (title) = props.title
    val (text) = props.text
    val (confirmButtonText) = props.confirmButtonText
    val (dismissButtonText) = props.dismissButtonText
    val (visible) = props.visible

    if (!visible) {
      return
    }

    AlertDialog(
      modifier = Modifier.fromExpoModifiers(props.modifiers.value),
      confirmButton = {
        confirmButtonText?.let {
          TextButton(onClick = { onConfirmPressed.invoke(AlertDialogButtonPressedEvent()) }) {
            Text(it)
          }
        }
      },
      dismissButton = {
        dismissButtonText?.let {
          TextButton(onClick = { onDismissPressed.invoke(AlertDialogButtonPressedEvent()) }) {
            Text(it)
          }
        }
      },
      onDismissRequest = { onDismissPressed.invoke(AlertDialogButtonPressedEvent()) },
      title = { title?.let { Text(it) } },
      text = { text?.let { Text(it) } }
    )
  }
}
