@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.view.ViewGroup
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.RichTooltip
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.TooltipState
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.rememberCoroutineScope
import androidx.core.view.size
import kotlin.coroutines.cancellation.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.withContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

// --- PlainTooltipView ---

data class PlainTooltipViewProps(
  val containerColor: MutableState<Color?> = mutableStateOf(null),
  val contentColor: MutableState<Color?> = mutableStateOf(null),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class PlainTooltipView(context: Context, appContext: AppContext) :
  ExpoComposeView<PlainTooltipViewProps>(context, appContext) {
  override val props = PlainTooltipViewProps()

  @Composable
  override fun ComposableScope.Content() {
    Children(this)
  }
}

// --- RichTooltipView ---

data class RichTooltipViewProps(
  val containerColor: MutableState<Color?> = mutableStateOf(null),
  val contentColor: MutableState<Color?> = mutableStateOf(null),
  val titleContentColor: MutableState<Color?> = mutableStateOf(null),
  val actionContentColor: MutableState<Color?> = mutableStateOf(null),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class RichTooltipView(context: Context, appContext: AppContext) :
  ExpoComposeView<RichTooltipViewProps>(context, appContext) {
  override val props = RichTooltipViewProps()

  @Composable
  override fun ComposableScope.Content() {
    Children(this)
  }
}

// --- TooltipBoxView ---

data class TooltipBoxViewProps(
  val isPersistent: MutableState<Boolean> = mutableStateOf(false),
  val hasAction: MutableState<Boolean> = mutableStateOf(false),
  val enableUserInput: MutableState<Boolean> = mutableStateOf(true),
  val focusable: MutableState<Boolean> = mutableStateOf(false),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class TooltipBoxView(context: Context, appContext: AppContext) :
  ExpoComposeView<TooltipBoxViewProps>(context, appContext) {
  override val props = TooltipBoxViewProps()
  internal var tooltipState: TooltipState? = null
  private var composeScope: CoroutineScope? = null

  suspend fun show() {
    val scope = composeScope ?: return
    val state = tooltipState ?: return
    try {
      withContext(scope.coroutineContext) {
        state.show()
      }
    } catch (_: CancellationException) {
    }
  }

  suspend fun dismiss() {
    val scope = composeScope ?: return
    val state = tooltipState ?: return
    try {
      withContext(scope.coroutineContext) {
        state.dismiss()
      }
    } catch (_: CancellationException) {
    }
  }

  @Composable
  override fun ComposableScope.Content() {
    val tooltipSlotView = findChildSlotView(this@TooltipBoxView, "tooltip")
    val plainTooltipView = tooltipSlotView?.let { findChildOfType<PlainTooltipView>(it) }
    val richTooltipView = tooltipSlotView?.let { findChildOfType<RichTooltipView>(it) }

    val tooltipState = rememberTooltipState(isPersistent = props.isPersistent.value)
    val scope = rememberCoroutineScope()
    this@TooltipBoxView.tooltipState = tooltipState
    this@TooltipBoxView.composeScope = scope

    val positionProvider = if (richTooltipView != null) {
      TooltipDefaults.rememberRichTooltipPositionProvider()
    } else {
      TooltipDefaults.rememberPlainTooltipPositionProvider()
    }

    TooltipBox(
      positionProvider = positionProvider,
      enableUserInput = props.enableUserInput.value,
      focusable = props.focusable.value,
      hasAction = props.hasAction.value,
      tooltip = {
        if (plainTooltipView != null) {
          PlainTooltip(
            containerColor = plainTooltipView.props.containerColor.value.composeOrNull
              ?: TooltipDefaults.plainTooltipContainerColor,
            contentColor = plainTooltipView.props.contentColor.value.composeOrNull
              ?: TooltipDefaults.plainTooltipContentColor,
            modifier = ModifierRegistry.applyModifiers(plainTooltipView.props.modifiers.value, appContext, this@Content, globalEventDispatcher)
          ) {
            with(ComposableScope()) { with(plainTooltipView) { Content() } }
          }
        } else if (richTooltipView != null) {
          val titleSlotView = findChildSlotView(richTooltipView, "title")
          val textSlotView = findChildSlotView(richTooltipView, "text")
          val actionSlotView = findChildSlotView(richTooltipView, "action")

          RichTooltip(
            title = titleSlotView?.let { { it.renderSlot() } },
            action = actionSlotView?.let { { it.renderSlot() } },
            colors = TooltipDefaults.richTooltipColors(
              containerColor = richTooltipView.props.containerColor.value.composeOrNull
                ?: TooltipDefaults.richTooltipColors().containerColor,
              contentColor = richTooltipView.props.contentColor.value.composeOrNull
                ?: TooltipDefaults.richTooltipColors().contentColor,
              titleContentColor = richTooltipView.props.titleContentColor.value.composeOrNull
                ?: TooltipDefaults.richTooltipColors().titleContentColor,
              actionContentColor = richTooltipView.props.actionContentColor.value.composeOrNull
                ?: TooltipDefaults.richTooltipColors().actionContentColor
            ),
            modifier = ModifierRegistry.applyModifiers(richTooltipView.props.modifiers.value, appContext, this@Content, globalEventDispatcher)
          ) {
            textSlotView?.renderSlot()
          }
        }
      },
      state = tooltipState,
      modifier = ModifierRegistry.applyModifiers(props.modifiers.value, appContext, this@Content, globalEventDispatcher)
    ) {
      Children(ComposableScope(), filter = { !isSlotView(it) })
    }
  }
}

// --- Helpers ---

inline fun <reified T> findChildOfType(viewGroup: ViewGroup): T? {
  for (index in 0..<viewGroup.size) {
    val child = viewGroup.getChildAt(index)
    if (child is T) return child
  }
  return null
}
