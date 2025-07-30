package expo.modules.ui

import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarDefaults
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field
import java.io.Serializable

open class SnackbarActionPressedEvent() : Record, Serializable
open class SnackbarDismissedEvent() : Record, Serializable

class SnackbarColors : Record {
  @Field
  val containerColor: Color? = null

  @Field
  val contentColor: Color? = null

  @Field
  val actionColor: Color? = null

  @Field
  val actionContentColor: Color? = null

  @Field
  val dismissActionContentColor: Color? = null
}

data class SnackbarProps(
  val actionLabel: MutableState<String?> = mutableStateOf(null),
  val duration: MutableState<String?> = mutableStateOf("long"),
  val message: MutableState<String> = mutableStateOf(""),
  val withDismissAction: MutableState<Boolean> = mutableStateOf(false),
  val visible: MutableState<Boolean> = mutableStateOf(false),
  val colors: MutableState<SnackbarColors?> = mutableStateOf(null),
) : ComposeProps

private fun getSnackbarDuration(duration: String?, actionLabel: String?): SnackbarDuration {
  return when (duration) {
    "short" -> SnackbarDuration.Short
    "long" -> SnackbarDuration.Long
    "indefinite" -> SnackbarDuration.Indefinite
    // matches the default behavior of the SnackbarHost if no duration is provided
    else -> if (actionLabel == null) SnackbarDuration.Short else SnackbarDuration.Indefinite
  }
}

class SnackbarView(context: Context, appContext: AppContext) :
  ExpoComposeView<SnackbarProps>(context, appContext, withHostingView = true) {
  override val props = SnackbarProps()
  private val onActionPressed by EventDispatcher<SnackbarActionPressedEvent>()
  private val onDismissed by EventDispatcher<SnackbarDismissedEvent>()

  @Composable
  override fun Content(modifier: Modifier) {
    val (actionLabel) = props.actionLabel
    val (duration) = props.duration
    val (message) = props.message
    val (withDismissAction) = props.withDismissAction
    val (visible) = props.visible
    val (colors) = props.colors
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(visible) {
      if (visible) {
        val result = snackbarHostState.showSnackbar(
          message = message,
          actionLabel = actionLabel,
          duration = getSnackbarDuration(duration, actionLabel),
          withDismissAction = withDismissAction
        )
        
        when (result) {
          SnackbarResult.ActionPerformed -> {
            onActionPressed(SnackbarActionPressedEvent())
          }
          SnackbarResult.Dismissed -> {
            onDismissed(SnackbarDismissedEvent())
          }
        }
      }
    }

    SnackbarHost(
      hostState = snackbarHostState,
      modifier = Modifier
        .fillMaxSize()
        .wrapContentHeight(Alignment.Bottom),
      snackbar = { snackbarData ->
        Snackbar(
          snackbarData = snackbarData,
          containerColor = colors?.containerColor?.compose ?: SnackbarDefaults.color,
          contentColor = colors?.contentColor?.compose ?: SnackbarDefaults.contentColor,
          actionColor = colors?.actionColor?.compose ?: SnackbarDefaults.actionColor,
          actionContentColor = colors?.actionContentColor?.compose ?: SnackbarDefaults.actionContentColor,
          dismissActionContentColor = colors?.dismissActionContentColor?.compose ?: SnackbarDefaults.dismissActionContentColor
        )
      }
    )
  }
}
